"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  userEmail?: string;
  userName: string;
  userPhone: string;
  trackingNumber: string;
  estimatedDelivery: Date | null;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded"
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, "productsOrder");
        const q = query(ordersRef, orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedOrders.push({
            id: doc.id,
            orderNumber: data.orderNumber,
            orderDate: data.orderDate && typeof data.orderDate.toDate === "function"
              ? data.orderDate.toDate()
              : new Date(data.orderDate || Date.now()),
            status: data.status,
            total: data.total,
            subtotal: data.subtotal,
            shipping: data.shipping,
            tax: data.tax,
            items: data.items || [],
            shippingAddress: data.shippingAddress,
            billingAddress: data.billingAddress,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            userEmail: data.userEmail,
            userName: data.shippingAddress?.firstName + ' ' + data.shippingAddress?.lastName,
            userPhone: data.shippingAddress?.phone,
            trackingNumber: data.trackingNumber,
            estimatedDelivery: data.estimatedDelivery && typeof data.estimatedDelivery.toDate === "function"
              ? data.estimatedDelivery.toDate()
              : (data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined)
          });
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const fields = [order.orderNumber, order.userName, order.userEmail].map(f => (f || '').toLowerCase());
        return fields.some(f => f.includes(lower));
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (sortBy === "date-desc") {
      filtered.sort((a, b) => (b.orderDate as any) - (a.orderDate as any));
    } else if (sortBy === "date-asc") {
      filtered.sort((a, b) => (a.orderDate as any) - (b.orderDate as any));
    } else if (sortBy === "total-desc") {
      filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (sortBy === "total-asc") {
      filtered.sort((a, b) => (a.total || 0) - (b.total || 0));
    }
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy]);

  const exportToCSV = () => {
    const headers = [
      "Order Number", "Status", "Order Date", "Customer Name", "Customer Email", "Customer Phone", "Payment Method", "Payment Status", "Subtotal", "Shipping", "Tax", "Total", "Tracking Number", "Estimated Delivery", "Shipping Address", "Billing Address", "Items"
    ];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      order.status,
      formatDate(order.orderDate, true),
      order.userName,
      order.userEmail,
      order.userPhone,
      order.paymentMethod,
      order.paymentStatus,
      order.subtotal,
      order.shipping,
      order.tax,
      order.total,
      order.trackingNumber || "",
      order.estimatedDelivery ? formatDate(order.estimatedDelivery, true) : "",
      formatAddress(order.shippingAddress),
      formatAddress(order.billingAddress),
      order.items.map(i => `${i.name} (x${i.quantity})`).join("; ")
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(x => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date | string | undefined | null, withTime = false) => {
    if (!date) return "N/A";
    let d: Date;
    if (typeof date === "string") {
      d = new Date(date);
    } else {
      d = date;
    }
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(d);
  };

  const formatAddress = (addr?: Address) => {
    if (!addr) return "N/A";
    return `${addr.firstName} ${addr.lastName}, ${addr.address1}${addr.address2 ? ', ' + addr.address2 : ''}, ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.phone}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-[#001F3F]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "⏳";
      case "processing": return "⚙️";
      case "shipped": return "📦";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "📋";
    }
  };

  // Helper to update order status in Firestore (both global and user order)
  async function updateOrderStatus({
    orderId,
    newStatus,
    userId,
    setOrders
  }: {
    orderId: string,
    newStatus: string,
    userId: string,
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  }) {
    try {
      // 1. Update global order
      const globalOrderRef = doc(db, "productsOrder", orderId);
      await updateDoc(globalOrderRef, { status: newStatus });
      // 2. Find and update user order
      if (userId) {
        const userOrdersCol = collection(db, "users", userId, "orders");
        const userOrdersSnap = await getDocs(userOrdersCol);
        let userOrderDocId = null;
        userOrdersSnap.forEach(docSnap => {
          if (docSnap.data().globalOrderId === orderId) {
            userOrderDocId = docSnap.id;
          }
        });
        if (userOrderDocId) {
          const userOrderRef = doc(db, "users", userId, "orders", userOrderDocId);
          await updateDoc(userOrderRef, { status: newStatus });
        }
      }
      // 3. Optimistically update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update order status: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-[#001F3F]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#001F3F] h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders, customer name, or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[#001F3F] bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-[#001F3F] bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-[#001F3F] bg-white"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="total-desc">Total: High to Low</option>
              <option value="total-asc">Total: Low to High</option>
            </select>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#001F3F] text-white rounded-md hover:bg-[#003366]"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#001F3F] mb-2">All Orders</h1>
          <p className="text-[#001F3F]">View and manage all active orders</p>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-[#001F3F]">No orders found</h3>
            <p className="mt-1 text-sm text-[#001F3F]">No orders have been placed yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden bg-white text-[#001F3F] border-gray-300">
                <CardHeader className="bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                      <Badge className={getStatusColor(order.status)}>
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            await updateOrderStatus({
                              orderId: order.id,
                              newStatus,
                              userId: order.userId || "",
                              setOrders
                            });
                          }}
                          className={
                            "bg-transparent border-none text-inherit font-semibold focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          }
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status} className="text-[#001F3F]">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </Badge>
                      <div>
                        <p className="font-medium text-[#001F3F]">{order.orderNumber}</p>
                        <p className="text-sm text-[#001F3F]">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(order.orderDate, true)}
                        </p>
                        {order.userEmail && (
                          <p className="text-xs text-[#001F3F]">{order.userEmail}</p>
                        )}
                        {order.userPhone && (
                          <p className="text-xs text-[#001F3F]">{order.userPhone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#001F3F] font-semibold">Payment: {order.paymentMethod?.toUpperCase() || 'N/A'}</span>
                      <span className="block text-xs text-[#001F3F]">Status: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'N/A'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white text-[#001F3F]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h4 className="font-medium text-[#001F3F] mb-3">Items Ordered</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#001F3F] truncate">{item.name}</p>
                              <p className="text-sm text-[#001F3F]">
                                Qty: {item.quantity} {item.size && <>• {item.size}</>} {item.color && <>• {item.color}</>}
                              </p>
                              <p className="text-sm font-medium text-[#001F3F]">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary & Addresses */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-[#001F3F] mb-2">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.subtotal || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping || 0)}</span>
                          </div>
                          {order.tax > 0 && (
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>{formatCurrency(order.tax)}</span>
                            </div>
                          )}
                          <div className="border-t pt-2 flex justify-between font-medium">
                            <span>Total:</span>
                            <span>{formatCurrency(order.total || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-[#001F3F] mb-2">Shipping Address</h4>
                        <p className="text-sm text-[#001F3F]">
                          {formatAddress(order.shippingAddress)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-[#001F3F] mb-2">Billing Address</h4>
                        <p className="text-sm text-[#001F3F]">
                          {formatAddress(order.billingAddress)}
                        </p>
                      </div>
                      {order.trackingNumber && (
                        <div>
                          <h4 className="font-medium text-[#001F3F] mb-2">Tracking</h4>
                          <p className="text-sm text-[#001F3F]">
                            Number: {order.trackingNumber}<br />
                            {order.estimatedDelivery && (
                              <>Estimated Delivery: {formatDate(order.estimatedDelivery, true)}</>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 