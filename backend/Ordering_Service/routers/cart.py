from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_db_connection
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:4000/auth/token")


async def validate_token_and_roles(token: str, allowed_roles: List[str]):
    USER_SERVICE_ME_URL = "http://localhost:4000/auth/users/me"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_ME_URL, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            error_detail = f"Auth service error: {e.response.status_code} - {e.response.text}"
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            logger.error(f"Auth service unavailable: {e}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Auth service unavailable: {e}")

    user_data = response.json()
    if user_data.get("userRole") not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


class CartItem(BaseModel):
    username: str
    product_id: int
    product_name: str
    quantity: int
    price: float
    product_type: Optional[str] = None
    product_category: Optional[str] = None
    order_type: str


class CartResponse(BaseModel):
    order_item_id: int
    product_id: Optional[int]
    product_name: str
    quantity: int
    price: float
    product_type: Optional[str]
    product_category: Optional[str]
    order_type: str
    status: str
    created_at: str


class DeliveryInfoRequest(BaseModel):
    FirstName: str
    MiddleName: Optional[str] = None
    LastName: str
    Address: str
    City: str
    Province: str
    Landmark: Optional[str] = None
    EmailAddress: Optional[str] = None
    PhoneNumber: str
    Notes: Optional[str] = None


@router.post("/deliveryinfo", status_code=status.HTTP_201_CREATED)
async def add_delivery_info(delivery_info: DeliveryInfoRequest, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        await cursor.execute("""
            INSERT INTO DeliveryInfo (
                FirstName, MiddleName, LastName, Address, City, Province, Landmark, EmailAddress, PhoneNumber, Notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            delivery_info.FirstName,
            delivery_info.MiddleName,
            delivery_info.LastName,
            delivery_info.Address,
            delivery_info.City,
            delivery_info.Province,
            delivery_info.Landmark,
            delivery_info.EmailAddress,
            delivery_info.PhoneNumber,
            delivery_info.Notes
        ))
        await conn.commit()
    except Exception as e:
        logger.error(f"Error adding delivery info: {e}")
        raise HTTPException(status_code=500, detail="Failed to add delivery info")
    finally:
        await cursor.close()
        await conn.close()
    return {"message": "Delivery info added successfully"}


@router.get("/{username}", response_model=List[CartResponse])
async def get_cart(username: str, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    conn = await get_db_connection()
    cursor = await conn.cursor()

    await cursor.execute("""
        SELECT OrderID, OrderDate, Status
        FROM Orders
        WHERE UserName = ? AND Status = 'Pending'
        ORDER BY OrderDate DESC
        OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
    """, (username,))
    order = await cursor.fetchone()

    if not order:
        await cursor.close()
        await conn.close()
        return []

    order_id = order[0]

    await cursor.execute("""
        SELECT OrderItemID, ProductName, ProductType, ProductCategory, Quantity, Price
        FROM OrderItems
        WHERE OrderID = ?
    """, (order_id,))
    items = await cursor.fetchall()
    await cursor.close()
    await conn.close()

    cart = []
    for item in items:
        cart.append(CartResponse(
            order_item_id=item[0],
            product_id=None,
            product_name=item[1],
            product_type=item[2],
            product_category=item[3],
            quantity=item[4],
            price=float(item[5]),
            order_type=order[2],
            status=order[2],
            created_at=order[1].strftime("%Y-%m-%d %H:%M:%S")
        ))
    return cart


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_to_cart(item: CartItem, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        await cursor.execute("""
            SELECT OrderID
            FROM Orders
            WHERE UserName = ? AND Status = 'Pending'
            ORDER BY OrderDate DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        """, (item.username,))
        order = await cursor.fetchone()

        if order:
            order_id = order[0]
        else:
            await cursor.execute("""
                INSERT INTO Orders (UserName, OrderType, PaymentMethod, Subtotal, DeliveryFee, TotalAmount, DeliveryNotes, Status)
                OUTPUT INSERTED.OrderID
                VALUES (?, ?, ?, 0, 0, 0, '', 'Pending')
            """, (item.username, item.order_type, 'Cash'))
            row = await cursor.fetchone()
            order_id = row[0] if row else None

        await cursor.execute("""
            SELECT OrderItemID, Quantity FROM OrderItems
            WHERE OrderID = ? AND ProductName = ? AND ProductType = ? AND ProductCategory = ?
        """, (order_id, item.product_name, item.product_type or '', item.product_category or ''))

        existing_item = await cursor.fetchone()

        if existing_item:
            order_item_id, current_qty = existing_item
            await cursor.execute("""
                UPDATE OrderItems
                SET Quantity = ?
                WHERE OrderItemID = ?
            """, (current_qty + item.quantity, order_item_id))
        else:
            await cursor.execute("""
                INSERT INTO OrderItems (OrderID, ProductName, ProductType, ProductCategory, Quantity, Price)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                order_id,
                item.product_name,
                item.product_type or '',
                item.product_category or '',
                item.quantity,
                item.price
            ))

        await conn.commit()

    except Exception as e:
        logger.error(f"Error adding to cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item to cart")
    finally:
        await cursor.close()
        await conn.close()

    return {"message": "Item added to cart"}


@router.put("/quantity/{order_item_id}")
async def update_quantity(order_item_id: int, new_quantity: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    if new_quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        await cursor.execute("""
            UPDATE OrderItems
            SET Quantity = ?
            WHERE OrderItemID = ?
        """, (new_quantity, order_item_id))
        await conn.commit()
    except Exception as e:
        logger.error(f"Error updating quantity: {e}")
        raise HTTPException(status_code=500, detail="Failed to update quantity")
    finally:
        await cursor.close()
        await conn.close()
    return {"message": "Quantity updated"}


@router.delete("/{order_item_id}", status_code=status.HTTP_200_OK)
async def remove_from_cart(order_item_id: int, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        logger.info(f"Removing from cart: {order_item_id}")
        await cursor.execute("DELETE FROM OrderItems WHERE OrderItemID = ?", (order_item_id,))
        await conn.commit()
    except Exception as e:
        logger.error(f"Error removing from cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove item from cart")
    finally:
        await cursor.close()
        await conn.close()
    return {"message": "Item removed from cart"}


@router.post("/cart/finalize", status_code=status.HTTP_200_OK)
async def finalize_order(username: str, token: str = Depends(oauth2_scheme)):
    await validate_token_and_roles(token, ["user", "admin", "staff"])
    conn = await get_db_connection()
    cursor = await conn.cursor()
    try:
        await cursor.execute("""
            SELECT OrderID FROM Orders
            WHERE UserName = ? AND Status = 'Pending'
            ORDER BY OrderDate DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        """, (username,))
        order = await cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="No pending order found")

        order_id = order[0]

        await cursor.execute("""
            UPDATE Orders
            SET Status = 'Pending'
            WHERE OrderID = ?
        """, (order_id,))
        await conn.commit()
    except Exception as e:
        logger.error(f"Error finalizing order: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to finalize order: {str(e)}")
    finally:
        await cursor.close()
        await conn.close()

    return {"message": "Order finalized successfully"}
