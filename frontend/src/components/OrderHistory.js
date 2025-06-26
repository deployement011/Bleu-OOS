import React, { useState } from 'react';
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

  const filteredOrders = (orders) => {
    return orders.filter(
      (order) =>
        order.id.toString().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge status-pending">Processing</span>;
      case 'completed':
        return <span className="status-badge status-completed">Completed</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
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
            <th>No.</th>
            <th>Order Type</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
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
                      <td rowSpan={order.products.length}>{order.id}</td>
                      <td rowSpan={order.products.length}>{order.orderType}</td>
                    </>
                  )}
                  <td>
                    {/* Placeholder for product image */}
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: '12px',
                        borderRadius: '4px',
                      }}
                    >
                      Image
                    </div>
                    <div>{product.name}</div>
                  </td>
                  <td>{product.quantity}</td>
                  <td>₱{product.price.toFixed(2)}</td>
                  <td>₱{(product.price * product.quantity).toFixed(2)}</td>
                  {index === 0 && <td rowSpan={order.products.length}>{getStatusBadge(order.status)}</td>}
                  {index === 0 && (
                    <td rowSpan={order.products.length}>
                      <button className="action-btn view" title="View" onClick={() => {
                        setOrderToView(order);
                        setShowInvoiceModal(true);
                      }}>
                        <EyeFill />
                      </button>
                      {activeTab === 'pending' && (
                      <button
                        className="action-btn cancel"
                        title="Cancel Order"
                        onClick={() => handleCancelClick(order)}
                        style={{ marginLeft: '8px', color: 'red' }}
                      >
                        <XCircle />
                      </button>
                      )}
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
