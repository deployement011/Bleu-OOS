from fastapi import APIRouter, HTTPException, Depends, status, Form
from datetime import datetime
from database import get_db_connection 
from routers.auth import get_current_active_user, role_required 
import bcrypt
from typing import Optional

router = APIRouter()



@router.post('/create', dependencies=[Depends(role_required(["superadmin"]))])
async def create_user(
    firstName: str = Form(...),
    middleName: Optional[str] = Form(None),
    lastName: str = Form(...),
    suffix: Optional[str] = Form(None),
    username: str = Form(...), 
    password: str = Form(...), 
    email: str = Form(...), 
    phoneNumber: Optional[str] = Form(None),
    city: Optional[str] = Form('Unknown'),
    province: Optional[str] = Form('Unknown'),
    landmark: Optional[str] = Form('N/A'),
    block: Optional[str] = Form(None),
    street: Optional[str] = Form(None),
    subdivision: Optional[str] = Form(None),
    userRole: str = Form(...),
    system: str = Form(...),

):
    if userRole not in ['admin', 'manager', 'staff', 'cashier', 'rider', 'super admin']:
        raise HTTPException(status_code=400, detail="Invalid role")
    if system not in ['IMS', 'POS', 'OOS', 'AUTH']:
        raise HTTPException(status_code=400, detail="Invalid system")
    if not password.strip(): 
        raise HTTPException(status_code=400, detail="Password is required")
    
    if not username.strip():
            raise HTTPException(status_code=400, detail="Username is required")

    conn = None 
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()

        await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND isDisabled = 0", (email,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already used")

        await cursor.execute("SELECT 1 FROM Users WHERE Username = ? AND isDisabled = 0", (username,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"Username '{username}' is already taken.")

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await cursor.execute('''
            INSERT INTO Users (UserPassword, Email, UserRole, isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix, City, Province, Landmark, Block, Street, Subdivision)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (hashed_password, email, userRole, 0, datetime.utcnow(), system, username, phoneNumber, firstName, middleName, lastName, suffix, city, province, landmark, block, street, subdivision))
        await conn.commit()

    except HTTPException: 
        raise
    except Exception as e:
        print(f"Error in create_user: {e}") 
        raise HTTPException(status_code=500, detail=f"An internal server error occurred during user creation.")
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()

    return {'message': f'{userRole.capitalize()} created successfully!'}


@router.get('/list-users', dependencies=[Depends(role_required(['superadmin']))])
async def list_users():
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute(''' 
            SELECT UserID, Email, UserRole,  isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix
            FROM Users
        ''')
        users_db = await cursor.fetchall()
    except Exception as e:
        print(f"Error in list_users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user list.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    users_list = []
    for u in users_db:
        users_list.append({
            "userID": u[0], 
            "firstName": u[1],
            "middleName": u[2],
            "lastName": u[3], 
            "suffix": u[4],   
            "username": u[5], 
            "email": u[6],
            "userRole": u[7], 
            "createdAt": u[8].isoformat() if u[8] else None,
            "system": u[9],
            "phoneNumber": u[10],
            "isDisabled": u[11]
        })
    return users_list


@router.put("/update/{user_id}", dependencies=[Depends(role_required(['superadmin']))])
async def update_user(
    user_id: int,
    firstName: Optional[str] = Form(None),
    middleName: Optional[str] = Form(None),
    lastName: Optional[str] = Form(None),
    suffix: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None), 
    email: Optional[str] = Form(None),
    phoneNumber: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    province: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    block: Optional[str] = Form(None),
    street: Optional[str] = Form(None),
    subdivision: Optional[str] = Form(None),
):
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute("SELECT UserRole FROM Users WHERE UserID = ?", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        updates = []
        values = []


        if email:
            await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND UserID != ? AND isDisabled = 0", (email, user_id))
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email is already used by another user")
            updates.append('Email = ?')
            values.append(email)
        
        if phoneNumber is not None:
            # Truncate phoneNumber to max length allowed by DB column (assumed 13 chars)
            max_phone_length = 13
            truncated_phone = phoneNumber[:max_phone_length]
            updates.append('PhoneNumber = ?')
            values.append(truncated_phone)

        if city is not None:
            updates.append('City = ?')
            values.append(city)

        if province is not None:
            updates.append('Province = ?')
            values.append(province)

        if landmark is not None:
            updates.append('Landmark = ?')
            values.append(landmark)

        if block is not None:
            updates.append('Block = ?')
            values.append(block)

        if street is not None:
            updates.append('Street = ?')
            values.append(street)

        if subdivision is not None:
            updates.append('Subdivision = ?')
            values.append(subdivision)

        if password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            updates.append('UserPassword = ?')
            values.append(hashed_password)  
        
        if firstName is not None:
            updates.append('FirstName = ?')
            values.append(firstName)

        if middleName is not None:
            updates.append('MiddleName = ?')
            values.append(middleName)

        if lastName is not None:
            updates.append('LastName = ?')
            values.append(lastName)

        if suffix is not None:
            updates.append('Suffix = ?')
            values.append(suffix)
        
        if username is not None:
            updates.append('Username = ?')
            values.append(username)

        if not updates:
            return {'message': 'No fields to update'}

        values.append(user_id)
        
        await cursor.execute(f"UPDATE Users SET {', '.join(updates)} WHERE UserID = ?", tuple(values))
        await conn.commit()
                
    except HTTPException: raise
    except Exception as e:
        print(f"Error in update_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during user update.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'User updated successfully'}


@router.put('/disable/{user_id}', dependencies=[Depends(role_required(['superadmin']))])
async def disable_user(user_id: int):
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute("SELECT 1 FROM Users WHERE UserID = ? AND isDisabled = 0", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found or already disabled.")
        await cursor.execute("UPDATE Users SET isDisabled = 1 WHERE UserID = ? ", (user_id,))
        await conn.commit()
    except HTTPException: raise
    except Exception as e:
        print(f"Error in disable_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during user deletion.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'User disabled successfully'}


@router.post('/signup-oos')
async def signup_oos_user(
    firstName: str = Form(...),
    middleName: Optional[str] = Form(None),
    lastName: str = Form(...),
    suffix: Optional[str] = Form(None),
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
    phoneNumber: str = Form(...),
):
    userRole = 'user'   
    system = 'OOS'     

    if not password.strip() or not username.strip():
        raise HTTPException(status_code=400, detail="Username and Password are required")

    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()

        await cursor.execute("SELECT 1 FROM Users WHERE Username = ? AND System = ? AND isDisabled = 0", (username, system))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken")
        await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND System = ? AND isDisabled = 0", (email, system))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already is used")

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await cursor.execute('''
            INSERT INTO Users (UserPassword, Email, UserRole, isDisabled, CreatedAt, System, Username, PhoneNumber, FirstName, MiddleName, LastName, Suffix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (hashed_password, email, userRole, 0, datetime.utcnow(), system, username, phoneNumber, firstName, middleName, lastName, suffix))
        await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in signup_oos_user: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during signup.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'OOS user account created successfully!'}

@router.get('/profile')
async def get_user_profile(current_user=Depends(get_current_active_user)):
    username = current_user.username
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute('''
            SELECT UserID, Username, FirstName, MiddleName, LastName, Email, PhoneNumber, City, Province, Landmark, Block, Street, Subdivision
            FROM Users
            WHERE Username = ? AND isDisabled = 0
        ''', (username,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "userID": user[0],
            "username": user[1],
            "firstName": user[2],
            "middleName": user[3],
            "lastName": user[4],
            "email": user[5],
            "phone": user[6],
            "city": user[7],
            "province": user[8],
            "landmark": user[9],
            "block": user[10],
            "street": user[11],
            "subdivision": user[12]
        }
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")
    finally:
        if cursor:
            await cursor.close()
        if conn:
            await conn.close()
@router.put('/profile/update')
async def update_own_profile(
    username: Optional[str] = Form(None),
    firstName: Optional[str] = Form(None),
    lastName: Optional[str] = Form(None),
    block: Optional[str] = Form(None),
    street: Optional[str] = Form(None),
    subdivision: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    province: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phoneNumber: Optional[str] = Form(None),
    current_user=Depends(get_current_active_user)
):
    user_id = current_user.userID
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID not found in token")
    conn = None
    cursor = None
    try:
        conn = await get_db_connection()
        cursor = await conn.cursor()
        await cursor.execute("SELECT UserRole FROM Users WHERE UserID = ?", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        updates = []
        values = []

        if email:
            await cursor.execute("SELECT 1 FROM Users WHERE Email = ? AND UserID != ? AND isDisabled = 0", (email, user_id))
            if await cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email is already used by another user")
            updates.append('Email = ?')
            values.append(email)
        
        if phoneNumber is not None:
            updates.append('PhoneNumber = ?')
            values.append(phoneNumber)

        if city is not None:
            updates.append('City = ?')
            values.append(city)

        if province is not None:
            updates.append('Province = ?')
            values.append(province)

        if landmark is not None:
            updates.append('Landmark = ?')
            values.append(landmark)

        if block is not None:
            updates.append('Block = ?')
            values.append(block)

        if street is not None:
            updates.append('Street = ?')
            values.append(street)

        if subdivision is not None:
            updates.append('Subdivision = ?')
            values.append(subdivision)

        if firstName is not None:
            updates.append('FirstName = ?')
            values.append(firstName)

        if lastName is not None:
            updates.append('LastName = ?')
            values.append(lastName)

        if username is not None:
            updates.append('Username = ?')
            values.append(username)

        if not updates:
            return {'message': 'No fields to update'}

        values.append(user_id)
        
        await cursor.execute(f"UPDATE Users SET {', '.join(updates)} WHERE UserID = ?", tuple(values))
        await conn.commit()
                
    except HTTPException: raise
    except Exception as e:
        print(f"Error in update_own_profile: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during user update.")
    finally:
        if cursor: await cursor.close()
        if conn: await conn.close()

    return {'message': 'User updated successfully'}
