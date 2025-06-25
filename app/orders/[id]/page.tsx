"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, CreditCard, Download, Share2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

interface TrackingEvent {
  date: Date;
  status: string;
  location: string;
  description: string;
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock order data
  const mockOrder: Order = {
    id: params.id,
    orderNumber: "ORD-2024-001",
    orderDate: new Date("2024-01-15T10:30:00"),
    status: "delivered",
    total: 2499.00,
    subtotal: 2499.00,
    shipping: 0,
    tax: 0,
    items: [
      {
        id: "1",
        name: "Charlotte Folk Black Tee",
        price: 1299.00,
        quantity: 1,
        image: "/images/products/charlottefolk-black-tee.jpg",
        size: "L",
        color: "Black"
      },
      {
        id: "2",
        name: "MNLA White Tee",
        price: 1200.00,
        quantity: 1,
        image: "/images/products/mnla-white-tee.jpg",
        size: "M",
        color: "White"
      }
    ],
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      address1: "123 Main Street",
      address2: "Apt 4B",
      city: "Cebu City",
      region: "Cebu",
      postalCode: "6000",
      phone: "+639123456789"
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      address1: "123 Main Street",
      address2: "Apt 4B",
      city: "Cebu City",
      region: "Cebu",
      postalCode: "6000",
      phone: "+639123456789"
    },
    paymentMethod: "GCash",
    paymentStatus: "paid",
    trackingNumber: "TRK123456789",
    estimatedDelivery: new Date("2024-01-18"),
    actualDelivery: new Date("2024-01-17T14:30:00"),
    notes: "Please deliver during business hours (9 AM - 6 PM)"
  };

  const mockTrackingEvents: TrackingEvent[] = [
    {
      date: new Date("2024-01-17T14:30:00"),
      status: "delivered",
      location: "Cebu City, Cebu",
      description: "Package delivered to recipient"
    },
    {
      date: new Date("2024-01-17T08:15:00"),
      status: "out_for_delivery",
      location: "Cebu City, Cebu",
      description: "Package out for delivery"
    },
    {
      date: new Date("2024-01-16T16:45:00"),
      status: "in_transit",
      location: "Cebu City, Cebu",
      description: "Package arrived at local facility"
    },
    {
      date: new Date("2024-01-16T10:20:00"),
      status: "shipped",
      location: "Manila, Metro Manila",
      description: "Package shipped from warehouse"
    },
    {
      date: new Date("2024-01-15T14:30:00"),
      status: "processing",
      location: "Manila, Metro Manila",
      description: "Order processed and packed"
    },
    {
      date: new Date("2024-01-15T10:30:00"),
      status: "ordered",
      location: "Online",
      description: "Order placed"
    }
  ];

  useEffect(() => {
    if (user) {
      // Fetch order details from Firebase productsOrder collection
      const fetchOrderDetails = async () => {
        try {
          const orderRef = doc(db, 'productsOrder', params.id);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const data = orderSnap.data();
            const fetchedOrder: Order = {
              id: orderSnap.id,
              orderNumber: data.orderNumber,
              orderDate: data.orderDate?.toDate() || new Date(),
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
              trackingNumber: data.trackingNumber,
              estimatedDelivery: data.estimatedDelivery?.toDate(),
              actualDelivery: data.actualDelivery?.toDate(),
              notes: data.notes
            };
            
            setOrder(fetchedOrder);
            
            // Generate mock tracking events based on order status
            // In a real app, you'd fetch this from a tracking service
            const mockTrackingEvents: TrackingEvent[] = [
              {
                date: fetchedOrder.orderDate,
                status: "ordered",
                location: "Online",
                description: "Order placed"
              }
            ];
            
            if (fetchedOrder.status !== 'pending') {
              mockTrackingEvents.push({
                date: new Date(fetchedOrder.orderDate.getTime() + 24 * 60 * 60 * 1000),
                status: "processing",
                location: "Manila, Metro Manila",
                description: "Order processed and packed"
              });
            }
            
            if (fetchedOrder.status === 'shipped' || fetchedOrder.status === 'delivered') {
              mockTrackingEvents.push({
                date: new Date(fetchedOrder.orderDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                status: "shipped",
                location: "Manila, Metro Manila",
                description: "Package shipped from warehouse"
              });
            }
            
            if (fetchedOrder.status === 'delivered') {
              mockTrackingEvents.push({
                date: fetchedOrder.actualDelivery || new Date(fetchedOrder.orderDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                status: "delivered",
                location: "Cebu City, Cebu",
                description: "Package delivered to recipient"
              });
            }
            
            setTrackingEvents(mockTrackingEvents);
          } else {
            // Order not found, use mock data for development
            setOrder(mockOrder);
            setTrackingEvents(mockTrackingEvents);
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
          // Fallback to mock data for development
          setOrder(mockOrder);
          setTrackingEvents(mockTrackingEvents);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [user, params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'processing': return <Package className="h-5 w-5" />;
      case 'shipped': return <Truck className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      case 'cancelled': return <Clock className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Order not found</h3>
          <p className="mt-1 text-sm text-gray-500">The order you're looking for doesn't exist.</p>
          <div className="mt-6">
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">Placed on {formatDate(order.orderDate)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  {order.estimatedDelivery && (
                    <span className="text-sm text-gray-600">
                      Estimated delivery: {formatDate(order.estimatedDelivery)}
                    </span>
                  )}
                </div>
                {order.notes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Size: {item.size} • Color: {item.color}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-mono text-lg font-medium">{order.trackingNumber}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          {index < trackingEvents.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">{event.status.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-sm text-gray-500">{event.location}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(event.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p className="text-sm text-gray-600">{order.shippingAddress.address2}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {order.shippingAddress.phone}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            {JSON.stringify(order.shippingAddress) !== JSON.stringify(order.billingAddress) && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && (
                      <p className="text-sm text-gray-600">{order.billingAddress.address2}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {order.billingAddress.city}, {order.billingAddress.region} {order.billingAddress.postalCode}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      {order.billingAddress.phone}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Need Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Questions about your order? We're here to help!
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 