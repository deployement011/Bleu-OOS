import React, { useState, useEffect } from 'react';
import { Table, Form, Modal, Button } from 'react-bootstrap';
import { EyeFill, XCircle } from 'react-bootstrap-icons';
import './OrderHistory.css'; // Custom styles for OrderHistory component

const OrderHistory = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [ordersData, setOrdersData] = useState({
    pending: [],
    completed: [],
    cancelled: [],
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // New state for invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [orderToView, setOrderToView] = useState(null);

  // Get auth token and username from localStorage or context
  const token = localStorage.getItem('authToken');

  // Extract username from JWT token if not stored separately
  const getUsernameFromToken = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.sub || payload.username || null;
    } catch (e) {
      console.error('Failed to parse token', e);
      return null;
    }
  };

  const username = getUsernameFromToken(token);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token || !username) return;

      try {
        // Fetch all orders history
        const response = await fetch(`http://localhost:7004/cart/orders/history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = response.ok ? await response.json() : [];

        // Separate orders by status
        const pendingOrders = [];
        const completedOrders = [];
        const cancelledOrders = [];

        data.forEach(order => {
          // Calculate total for each order
          const total = order.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
          const orderData = {
            id: order.id,
            orderType: order.orderType,
            products: order.products,
            status: order.status.toLowerCase(),
            date: order.date,
            total,
          };

          if (order.status.toLowerCase() === 'pending') {
            pendingOrders.push(orderData);
          } else if (order.status.toLowerCase() === 'completed') {
            completedOrders.push(orderData);
          } else if (order.status.toLowerCase() === 'cancelled') {
            cancelledOrders.push(orderData);
          }
        });

        setOrdersData({
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [token, username]);

  const filteredOrders = (orders) => {
    return orders.filter(
      (order) =>
        order.id.toString().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatusBadge = (status) => {
    // Capitalize first letter of status
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    let className = "status-badge";
    if (status === 'pending') className += " status-pending";
    else if (status === 'completed') className += " status-completed";
    else if (status === 'cancelled') className += " status-cancelled";
    return <span className={className}>{capitalizedStatus}</span>;
  };

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      // Remove order from pending and add to cancelled
      setOrdersData((prevData) => {
        const newPending = prevData.pending.filter((o) => o.id !== orderToCancel.id);
        const newCancelled = [...prevData.cancelled, { ...orderToCancel, status: 'cancelled' }];
        return { ...prevData, pending: newPending, cancelled: newCancelled };
      });
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  const handleCloseModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const renderTable = (orders) => {
    if (orders.length === 0) {
      return <div className="orderhistory-no-orders">No orders found</div>;
    }

    return (
      <Table className="orders-table">
        <thead>
          <tr>
            <th>Order Type</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders(orders).map((order) => (
            <React.Fragment key={order.id}>
              {order.products.map((product, index) => (
                <tr key={product.id}>
                  {index === 0 && (
                    <>
                      <td rowSpan={order.products.length}>{order.orderType}</td>
                    </>
                  )}
                  <td>
                    <div>{product.name}</div>
                  </td>
                  <td>{product.quantity}</td>
                  <td>₱{product.price.toFixed(2)}</td>
                  <td>₱{(product.price * product.quantity).toFixed(2)}</td>
                  {index === 0 && (
                    <td rowSpan={order.products.length}>
                      {(() => {
                        const dateObj = new Date(order.date);
                        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                        const day = dateObj.getDate().toString().padStart(2, '0');
                        const year = dateObj.getFullYear();
                        return `${month}/${day}/${year}`;
                      })()}
                    </td>
                  )}
                  {index === 0 && <td rowSpan={order.products.length}>{getStatusBadge(order.status)}</td>}
                  {index === 0 && (
                    <td rowSpan={order.products.length}>
                      <button className="action-btn view" title="View" onClick={() => {
                        setOrderToView(order);
                        setShowInvoiceModal(true);
                      }}>
                        <EyeFill />
                      </button>
                      {/* Removed cancel order button as requested */}
                      {/* {activeTab === 'pending' && (
                      <button
                        className="action-btn cancel"
                        title="Cancel Order"
                        onClick={() => handleCancelClick(order)}
                        style={{ marginLeft: '8px', color: 'red' }}
                      >
                        <XCircle />
                      </button>
                      )} */}
                    </td>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <div className="ordertable-container">
      <div className="table-header">
        <h5 style={{ color: '#4a9ba5' }}>Order History</h5>
        <Form.Control
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ul className="orderhistory-tabs nav nav-tabs">
        <li className="nav-item">
          <button
            className={`orderhistory-tab nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={activeTab === 'pending' ? { backgroundColor: '#4B929D', color: 'white' } : { color: 'black' }}
          >
            Pending Orders
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`orderhistory-tab nav-link ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
            style={activeTab === 'completed' ? { backgroundColor: '#4B929D', color: 'white' } : { color: 'black' }}
          >
            Completed
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`orderhistory-tab nav-link ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
            style={activeTab === 'cancelled' ? { backgroundColor: '#4B929D', color: 'white' } : { color: 'black' }}
          >
            Cancelled
          </button>
        </li>
      </ul>

      <div className="orderhistory-tab-content tab-content p-3 border border-top-0 rounded-bottom">
        {activeTab === 'pending' && renderTable(ordersData.pending)}
        {activeTab === 'completed' && renderTable(ordersData.completed)}
        {activeTab === 'cancelled' && renderTable(ordersData.cancelled)}
      </div>

      <Modal show={showCancelModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel order #{orderToCancel ? orderToCancel.id : ''}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            No
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Yes, Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Modal */}
      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Invoice for Order #{orderToView ? orderToView.id : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderToView ? (
            <div>
              <p><strong>Date:</strong> {orderToView.date}</p>
              <p><strong>Order Type:</strong> {orderToView.orderType}</p>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price (₱)</th>
                    <th>Subtotal (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderToView.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{product.price.toFixed(2)}</td>
                      <td>{(product.price * product.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <h5>Total: ₱{orderToView.total.toFixed(2)}</h5>
            </div>
          ) : (
            <p>No order selected.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderHistory;
