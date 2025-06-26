  import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { FaChevronDown, FaBell, FaSignOutAlt, FaBoxOpen, FaCheckCircle, FaSpinner, FaTruck, FaFilter, FaClock, FaUser, FaPhone, FaMapMarkerAlt, FaBox, FaTimesCircle, FaTruckPickup, FaTruckMoving, FaUndo } from "react-icons/fa";
import { Card, Form } from "react-bootstrap";
import riderImage from "../../assets/rider.jpg";
import "./deliverymanagement.css";

function DeliveryManagement() {
  const userRole = "Admin";
  const userName = "Lim Alcovendas";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");

  const [orders, setOrders] = useState([]);

  const riders = {};

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const currentDateFormatted = currentDate.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });

  const handleRiderChange = (orderId, newRider) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, assignedRider: newRider } : order
      )
    );
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, currentStatus: newStatus } : order
      )
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { color: "#d39e00", backgroundColor: "#fff3cd" };
      case "confirmed":
        return { color: "#198754", backgroundColor: "#d1e7dd" };
      case "preparing":
        return { color: "#2980b9", backgroundColor: "#cfe2ff" };
      case "readyToPickup":
        return { color: "#8e44ad", backgroundColor: "#e5dbff" };
      case "pickedUp":
        return { color: "#0d6efd", backgroundColor: "#cfe2ff" };
      case "inTransit":
        return { color: "#6610f2", backgroundColor: "#e5dbff" };
      case "delivered":
        return { color: "#198754", backgroundColor: "#d1e7dd" };
      case "cancelled":
        return { color: "#dc3545", backgroundColor: "#f8d7da" };
      case "returned":
        return { color: "#fd7e14", backgroundColor: "#ffe5d0" };
      default:
        return { color: "black", backgroundColor: "transparent" };
    }
  };

  return (
    <div className="d-flex" style={{ height: "100vh", backgroundColor: "#edf7f9" }}>
      <Container fluid className="p-4 main-content" style={{ marginLeft: "0px", width: "calc(100% - 0px)" }}>
        <header className="manage-header">
          <div className="header-left">
            <h2 className="page-title">Delivery Management</h2>
          </div>
          <div className="header-right">
            <div className="header-date">{currentDateFormatted}</div>
            <div className="header-profile">
              <div className="profile-pic"></div>
              <div className="profile-info">
                <div className="profile-role">Hi! I'm {userRole}</div>
                <div className="profile-name">{userName}</div>
              </div>
              <div className="dropdown-icon" onClick={() => setDropdownOpen(!dropdownOpen)}><FaChevronDown /></div>
              <div className="bell-icon"><FaBell className="bell-outline" /></div>
              {dropdownOpen && (
                <div className="profile-dropdown" style={{ position: "absolute", top: "100%", right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 1000, width: "150px" }}>
                                    <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
                                      <li
                                        onClick={() => window.location.reload()}
                                        style={{ cursor: "pointer", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", color: "#4b929d" }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                      >
                                        <FaUndo /> Refresh
                                      </li>
                                      <li
                                        onClick={() => { localStorage.removeItem("access_token"); window.location.href = "http://localhost:4002/"; }}
                                        style={{ cursor: "pointer", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", color: "#dc3545" }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8d7da"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                      >
                                        <FaSignOutAlt /> Logout
                                      </li>
                                    </ul>
                    </div>
              )}
            </div>
          </div>
        </header>
        <div className="status-labels" style={{ display: "flex", justifyContent: "space-around", marginTop: "10px", marginBottom: "20px", gap: "15px", flexWrap: "wrap" }}>
          {(() => {
            const statusCounts = {
              pending: 0,
              confirmed: 0,
              preparing: 0,
              pickedUp: 0,
              inTransit: 0,
              delivered: 0,
              cancelled: 0,
              returned: 0,
            };
            orders.forEach(order => {
              const status = order.currentStatus;
              if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
              }
            });
            return (
              <>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaClock color="#d39e00" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Pending</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.pending}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaCheckCircle color="#198754" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Confirmed</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.confirmed}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaSpinner color="#2980b9" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Preparing</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.preparing}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaTruckPickup color="#0d6efd" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Picked up</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.pickedUp}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaTruckMoving color="#6610f2" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>In transit</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.inTransit}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaTruck color="#198754" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Delivered</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.delivered}</span>
                </Card>
                <Card style={{ flex: "1", minWidth: "150px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FaUndo color="#fd7e14" size={32} />
                  <span style={{ fontSize: "1rem", fontWeight: "400" }}>Cancelled/Returned</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "700", textAlign: "center" }}>{statusCounts.cancelled + statusCounts.returned}</span>
                </Card>
              </>
            );
          })()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginTop: "20px", backgroundColor: "transparent", padding: "10px", borderRadius: "8px" }}>
          <div style={{ fontWeight: "600", fontSize: "1rem" }}>
            Orders {orders.length} of {orders.length}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <FaFilter size={20} />
            <span>Filter:</span>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "300px", marginLeft: "8px" }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="pickedUp">Picked Up</option>
              <option value="inTransit">In transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Cancelled/Returned</option>
            </Form.Select>
            <Form.Select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              style={{ width: "300px", marginLeft: "8px" }}
            >
              <option value="all">All Riders</option>
              <option value="rider1">Rider 1</option>
              <option value="rider2">Rider 2</option>
              <option value="rider3">Rider 3</option>
              <option value="rider4">Rider 4</option>
              <option value="rider5">Rider 5</option>
              <option value="rider6">Rider 6</option>
            </Form.Select>
          </div>
        </div>
        {(() => {
          const filteredOrders = orders
            .filter(order => (statusFilter === "all" || order.currentStatus === statusFilter))
            .filter(order => (riderFilter === "all" || order.assignedRider === riderFilter));
          return (
            <div style={{
              display: "flex",
              gap: "20px",
              marginTop: "20px",
              justifyContent: filteredOrders.length === 1 ? "flex-start" : "flex-start",
              flexWrap: "wrap",
              alignItems: "flex-start",
              width: "100%"
            }}>
              {filteredOrders.map((order, idx) => (
                <Card key={idx} style={{ padding: "20px", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start", width: "300px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <h5 style={{ color: "#4b929d" }}>Order #{order.id}</h5>
                    <p style={{
                      fontWeight: "600",
                      marginBottom: "5px",
                      color: getStatusStyle(order.currentStatus).color,
                      backgroundColor: getStatusStyle(order.currentStatus).backgroundColor,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      minWidth: "110px",
                      textAlign: "center"
                    }}>
                      {{
                        pending: "Pending",
                        confirmed: "Confirmed",
                        preparing: "Preparing",
                        readyToPickup: "Ready to Pickup",
                        pickedUp: "Picked Up",
                        inTransit: "In transit",
                        delivered: "Delivered",
                        cancelled: "Cancelled",
                        returned: "Cancelled/Returned"
                      }[order.currentStatus] || order.currentStatus}
                    </p>
                  </div>
                  <p style={{ marginBottom: "5px", display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", color: "gray" }}><FaClock color="#4b929d" /> Ordered at {order.orderedAt}</p>
                  <p style={{ marginBottom: "5px", display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", color: "black" }}><FaUser color="#4b929d" /> {order.customerName}</p>
                  <p style={{ marginBottom: "5px", display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", color: "black" }}><FaPhone color="#4b929d" /> {order.phone.replace(/^\+1-/, "63")}</p>
                  <p style={{ marginBottom: "5px", display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", color: "black" }}><FaMapMarkerAlt color="#4b929d" /> {order.address}</p>
                  <p style={{ fontWeight: "600", marginBottom: "5px", display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", color: "black" }}><FaBox color="#4b929d" /> Items ({order.items.length})</p>
                  {order.items.map((item, i) => (
                    <p key={i} style={{ marginBottom: "3px", alignSelf: "flex-start", color: "black", display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span style={{ marginLeft: "auto" }}>₱{item.price.toFixed(2)}</span>
                    </p>
                  ))}
                  <hr style={{ alignSelf: "stretch" }} />
                  <p style={{ fontWeight: "600", marginBottom: "0", alignSelf: "flex-start", color: "black", display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <span>Total</span>
                    <span style={{ marginLeft: "auto" }}>₱{order.total.toFixed(2)}</span>
                  </p>
                  {!order.assignedRider && (
                    <p style={{ backgroundColor: "#fff3cd", padding: "8px", borderRadius: "4px", marginTop: "10px", color: "#856404", width: "100%" }}>
                      Note: Please call when arrived
                    </p>
                  )}
                  {order.assignedRider && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", width: "100%", backgroundColor: "#f0f0f0", padding: "10px", borderRadius: "6px" }}>
                      <img src={riderImage} alt={riders[order.assignedRider].name} style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
                      <div>
                        <div style={{ fontWeight: "600" }}>{riders[order.assignedRider].name}</div>
                        <div>{riders[order.assignedRider].phone}</div>
                        <div>Active Orders: {riders[order.assignedRider].activeOrders}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: "10px", width: "100%" }}>
                    <label htmlFor={`assignRider-${order.id}`} style={{ fontWeight: "600", marginBottom: "5px", display: "block" }}>Assign Rider</label>
                    <Form.Select
                      id={`assignRider-${order.id}`}
                      value={order.assignedRider || ""}
                      onChange={(e) => handleRiderChange(order.id, e.target.value)}
                    >
                      <option value="">Select Rider</option>
                      <option value="rider1">Rider 1</option>
                      <option value="rider2">Rider 2</option>
                      <option value="rider3">Rider 3</option>
                      <option value="rider4">Rider 4</option>
                      <option value="rider5">Rider 5</option>
                      <option value="rider6">Rider 6</option>
                    </Form.Select>
                    <label htmlFor={`orderStatus-${order.id}`} style={{ fontWeight: "600", marginBottom: "5px", display: "block", marginTop: "10px" }}>Order Status</label>
                    <Form.Select
                      id={`orderStatus-${order.id}`}
                      value={order.currentStatus || ""}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="pickedUp">Picked Up</option>
                      <option value="inTransit">In transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Cancelled/Returned</option>
                    </Form.Select>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </Container>
    </div>
  );
}

export default DeliveryManagement;