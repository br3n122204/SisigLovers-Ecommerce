"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  dateOrdered: Date | null;
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
  userId?: string;
  deliveredAt?: number;
  adminProductId: string;
  statusHistory?: { status: string; timestamp: any }[];
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
        // Fetch all adminProducts
        const adminProductsSnapshot = await getDocs(collection(db, 'adminProducts'));
        let allOrders: Order[] = [];
        for (const productDoc of adminProductsSnapshot.docs) {
          const productId = productDoc.id;
          const ordersSnapshot = await getDocs(collection(db, 'adminProducts', productId, 'productsOrder'));
          ordersSnapshot.forEach(orderDoc => {
            const data = orderDoc.data();
            let dateOrderedValue: Date | null = null;
            if (data.dateOrdered && typeof data.dateOrdered.toDate === "function") {
              dateOrderedValue = data.dateOrdered.toDate();
            } else if (data.dateOrdered) {
              const d = new Date(data.dateOrdered);
              dateOrderedValue = isNaN(d.getTime()) ? null : d;
            }
            let deliveredAtValue;
            if (data.deliveredAt && typeof data.deliveredAt.toDate === "function") {
              deliveredAtValue = data.deliveredAt.toDate();
            } else if (data.deliveredAt) {
              deliveredAtValue = new Date(data.deliveredAt);
            }
            allOrders.push({
              id: orderDoc.id,
              orderNumber: data.orderNumber,
              dateOrdered: dateOrderedValue,
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
                : (data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined),
              userId: data.userId,
              deliveredAt: deliveredAtValue,
              adminProductId: productId,
              statusHistory: data.statusHistory || [],
            });
          });
        }
        // Sort allOrders by dateOrdered descending
        allOrders.sort((a, b) => {
          const dateA = (a.dateOrdered && a.dateOrdered instanceof Date) ? Number(a.dateOrdered.getTime()) : 0;
          const dateB = (b.dateOrdered && b.dateOrdered instanceof Date) ? Number(b.dateOrdered.getTime()) : 0;
          return dateB - dateA;
        });
        setOrders(allOrders);
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
      filtered.sort((a, b) => {
        const dateA = a.dateOrdered ? a.dateOrdered.getTime() : 0;
        const dateB = b.dateOrdered ? b.dateOrdered.getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "date-asc") {
      filtered.sort((a, b) => {
        const dateA = a.dateOrdered ? a.dateOrdered.getTime() : 0;
        const dateB = b.dateOrdered ? b.dateOrdered.getTime() : 0;
        return dateA - dateB;
      });
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
      formatDate(order.dateOrdered ? order.dateOrdered : new Date(0), true),
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

  const formatDateLong = (date: Date | string | undefined | null) => {
    if (!date) return "N/A";
    if (date === 'pending') return "Pending...";
    let d: Date;
    if (typeof date === "string") {
      d = new Date(date);
    } else {
      d = date as Date;
    }
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      default: return "bg-gray-100 text-gray-800";
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
    setOrders,
    deliveredAtUpdate = {},
    optimisticDeliveredAt
  }: {
    orderId: string,
    newStatus: string,
    userId: string,
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
    deliveredAtUpdate?: any,
    optimisticDeliveredAt?: Date | null
  }) {
    try {
      // Find the specific adminProductId for the order from the current state
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) {
        console.error("Order not found for orderId:", orderId);
        alert("Failed to update order status: Order not found.");
        return;
      }
      const adminProductId = orderToUpdate.adminProductId;

      // Optimistically update the UI
      const newHistoryEntry = { status: newStatus, timestamp: new Date() };
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, ...deliveredAtUpdate, deliveredAt: optimisticDeliveredAt !== undefined ? optimisticDeliveredAt : o.deliveredAt, statusHistory: [...(o.statusHistory || []), newHistoryEntry] }
          : o
      ));

      const orderRef = doc(db, 'adminProducts', adminProductId, 'productsOrder', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        ...deliveredAtUpdate,
        statusHistory: [...(orderToUpdate.statusHistory || []), newHistoryEntry],
      });

      // Update the user's order as well
      // First, find the user's order document using the globalOrderId (which is orderId here)
      const userOrdersCollectionRef = collection(db, 'users', userId, 'orders');
      const q = query(userOrdersCollectionRef, where('globalOrderId', '==', orderId));
      const userOrderSnapshot = await getDocs(q);

      if (!userOrderSnapshot.empty) {
        const userOrderIdToUpdate = userOrderSnapshot.docs[0].id;
        const userOrderRef = doc(db, 'users', userId, 'orders', userOrderIdToUpdate);
        await updateDoc(userOrderRef, {
          status: newStatus,
          ...deliveredAtUpdate,
          statusHistory: [...((userOrderSnapshot.docs[0].data().statusHistory) || []), newHistoryEntry],
        });
        console.log("User's order status updated successfully in Firestore!");
      } else {
        console.warn("User's order document not found with globalOrderId:", orderId, "for userId:", userId);
      }

      console.log("Order status updated successfully in Firestore!");
    } catch (err) {
      alert("Failed to update order status: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  // Helper to get a valid date from order (robust for Firestore Timestamp, string, number, or serverTimestamp placeholder)
  const getOrderDate = (order: any) => {
    const d = order.dateOrdered;
    if (!d) return undefined;
    if (typeof d.toDate === 'function') return d.toDate(); // Firestore Timestamp
    if (typeof d === 'object' && d._methodName === 'serverTimestamp') return 'pending'; // Pending server timestamp
    if (typeof d === 'string' || typeof d === 'number') {
      const dateObj = new Date(d);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3390ff] mx-auto"></div>
          <p className="mt-4 text-[#8ec0ff]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-black">
      <div className="w-full h-full bg-[#161e2e] px-8 py-10 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8ec0ff] h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders, customer name, or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] focus:border-transparent text-white bg-[#22304a] placeholder-[#8ec0ff]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#22304a] rounded-md px-3 py-2 text-white bg-[#22304a] focus:outline-none focus:ring-2 focus:ring-[#3390ff]"
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
              className="border border-[#22304a] rounded-md px-3 py-2 text-white bg-[#22304a] focus:outline-none focus:ring-2 focus:ring-[#3390ff]"
            >
              <option value="total-desc">Total: High to Low</option>
              <option value="total-asc">Total: Low to High</option>
            </select>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#3390ff] text-white rounded-md hover:bg-[#2360b7]"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3390ff] mb-2">All Orders</h1>
          <p className="text-[#8ec0ff]">View and manage all active orders</p>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-[#8ec0ff]">No orders found</h3>
            <p className="mt-1 text-sm text-[#8ec0ff]">No orders have been placed yet.</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-x-auto w-full">
            {filteredOrders.map((order) => {
              // Debug log for dateOrdered
              console.log('orderNumber:', order.orderNumber, 'dateOrdered:', order.dateOrdered, 'getOrderDate:', getOrderDate(order));
              return (
                <Card key={order.id} className="overflow-hidden bg-[#161e2e] text-white border border-[#22304a] w-full max-w-full box-border">
                  <CardHeader className="bg-[#22304a]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{getStatusIcon(order.status)}</span>
                        <Badge className={
                          order.status === 'pending' ? 'bg-yellow-300 text-black' :
                          order.status === 'processing' ? 'bg-blue-400 text-white' :
                          order.status === 'shipped' ? 'bg-purple-400 text-white' :
                          order.status === 'delivered' ? 'bg-green-400 text-white' :
                          order.status === 'cancelled' ? 'bg-red-400 text-white' :
                          'bg-[#8ec0ff] text-black'
                        }>
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              let deliveredAtUpdate = {};
                              let optimisticDeliveredAt = undefined;
                              if (newStatus === 'delivered') {
                                deliveredAtUpdate = { deliveredAt: new Date() };
                                optimisticDeliveredAt = new Date();
                              } else if (order.status === 'delivered' && newStatus !== 'delivered') {
                                deliveredAtUpdate = { deliveredAt: null };
                                optimisticDeliveredAt = null;
                              }
                              await updateOrderStatus({
                                orderId: order.id,
                                newStatus,
                                userId: order.userId || "",
                                setOrders,
                                deliveredAtUpdate,
                                optimisticDeliveredAt
                              });
                            }}
                            className="bg-transparent border-none text-inherit font-semibold focus:outline-none focus:ring-2 focus:ring-[#3390ff] rounded"
                          >
                            {ORDER_STATUSES.map(status => (
                              <option key={status} value={status} className="text-black">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </Badge>
                        <div>
                          <p className="font-medium text-white">{order.orderNumber}</p>
                          <p className="text-xs text-[#8ec0ff]">Date Ordered: {formatDateLong(getOrderDate(order))}</p>
                          {order.userEmail && (
                            <p className="text-xs text-[#8ec0ff]">{order.userEmail}</p>
                          )}
                          {order.userPhone && (
                            <p className="text-xs text-[#8ec0ff]">{order.userPhone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="block text-xs text-[#8ec0ff] font-semibold">Payment: {order.paymentMethod?.toUpperCase() || 'N/A'}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="block text-xs text-[#8ec0ff]">Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 bg-[#161e2e] text-white">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-medium text-[#8ec0ff] mb-3">Items Ordered</h4>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#22304a]">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{item.name}</p>
                                <p className="text-sm text-[#8ec0ff]">
                                  Qty: {item.quantity}
                                  {Array.isArray(item.size)
                                    ? (item.size as any[]).map((s, idx) => (
                                        <span key={idx}> • {s.size}: {s.stock}</span>
                                      ))
                                    : item.size && typeof item.size === 'object'
                                      ? ` • ${(item.size as any).size}: ${(item.size as any).stock}`
                                      : item.size
                                        ? ` • ${item.size}`
                                        : null}
                                  {item.color && <> • {item.color}</>}
                                </p>
                                <p className="text-sm font-medium text-[#3390ff]">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Order Summary */}
                      <div className="bg-[#22304a] rounded-lg p-4">
                        <h4 className="font-medium text-[#8ec0ff] mb-3">Order Summary</h4>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>Subtotal: <span className="text-[#3390ff]">{formatCurrency(order.subtotal)}</span></span>
                          <span>Shipping: <span className="text-[#3390ff]">{formatCurrency(order.shipping)}</span></span>
                          <span>Tax: <span className="text-[#3390ff]">{formatCurrency(order.tax)}</span></span>
                          <span className="font-semibold">Total: <span className="text-[#3390ff]">{formatCurrency(order.total)}</span></span>
                        </div>
                        <div className="mt-4">
                          {order.dateOrdered && (() => {
                            let dateOrderedObj: any = order.dateOrdered;
                            if (typeof dateOrderedObj === 'number' || typeof dateOrderedObj === 'string') dateOrderedObj = new Date(dateOrderedObj);
                            if ((dateOrderedObj as any) instanceof Date && !isNaN(dateOrderedObj.getTime())) {
                              return <span className="block text-xs text-[#8ec0ff]">Date Ordered: {formatDateLong(dateOrderedObj)}</span>;
                            }
                            return null;
                          })()}
                          {(() => {
                            let deliveredDateObj: any = order.deliveredAt;
                            if (typeof deliveredDateObj === 'number' || typeof deliveredDateObj === 'string') deliveredDateObj = new Date(deliveredDateObj);
                            if ((deliveredDateObj as any) instanceof Date && !isNaN(deliveredDateObj.getTime()) && order.status === 'delivered') {
                              return (
                                <span className="block text-xs text-[#8ec0ff]">
                                  Status: Delivered {formatDateLong(deliveredDateObj)}
                                </span>
                              );
                            }
                            return (
                              <span className="block text-xs text-[#8ec0ff]">Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-[#22304a] rounded-lg p-4">
                        <h4 className="font-medium text-[#8ec0ff] mb-2">Shipping Address</h4>
                        <p className="text-sm text-white">{formatAddress(order.shippingAddress)}</p>
                      </div>
                      <div className="bg-[#22304a] rounded-lg p-4">
                        <h4 className="font-medium text-[#8ec0ff] mb-2">Billing Address</h4>
                        <p className="text-sm text-white">{formatAddress(order.billingAddress)}</p>
                      </div>
                    </div>
                    {/* Status History */}
                    <div className="flex flex-col gap-4 pl-2 border-l-2 border-blue-900">
                      {order.statusHistory && order.statusHistory.length > 0 ? (
                        order.statusHistory.map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-400 mt-1" />
                            <div>
                              <div className="font-medium">{entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}</div>
                              <div className="text-xs text-[#93c5fd]">{formatDateLong(entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-[#93c5fd]">No status history yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 