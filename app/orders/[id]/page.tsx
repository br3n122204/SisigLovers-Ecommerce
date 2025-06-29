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
import { doc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from 'next/navigation';
import React from 'react';

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

export default function OrderDetailsPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (user) {
      const orderRef = doc(db, 'users', user.uid, 'orders', orderId);
      const unsubscribe = onSnapshot(orderRef, (orderSnap) => {
        if (orderSnap.exists()) {
          const data = orderSnap.data();
          const fetchedOrder: Order = {
            id: orderSnap.id,
            orderNumber: data.orderNumber,
            orderDate: (() => {
              const d = data.orderDate;
              if (d && typeof d.toDate === 'function') return d.toDate();
              if (typeof d === 'string' || typeof d === 'number') return new Date(d);
              return new Date();
            })(),
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
          setOrderItems(data.items || []);
        } else {
          setOrder(null);
          setOrderItems([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching order details:", error);
        setOrder(null);
        setOrderItems([]);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      setOrderItems([]);
    }
  }, [user, orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-[#001F3F]';
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
          <p className="mt-4 text-[#001F3F]">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-[#001F3F]" />
          <h3 className="mt-2 text-sm font-medium text-[#001F3F]">Order not found</h3>
          <p className="mt-1 text-sm text-[#001F3F]">The order you're looking for doesn't exist.</p>
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
          <Link href="/orders" className="inline-flex items-center text-sm text-[#001F3F] hover:text-[#003366] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#001F3F]">Order {order.orderNumber}</h1>
              <p className="text-[#001F3F] mt-1 font-medium">Date Ordered: {formatDate(order.orderDate)}</p>
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
                    <span className="text-sm text-[#001F3F]">
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
                <CardTitle>Items ({orderItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => (
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
                        <h4 className="font-medium text-[#001F3F]">{item.name}</h4>
                        <p className="text-sm text-[#001F3F] mt-1">
                          Size: {typeof item.size === 'object' && item.size !== null && 'size' in item.size
                            ? (item.size as any).size
                            : item.size}
                          • Color: {typeof item.color === 'object' && item.color !== null && 'color' in item.color
                            ? (item.color as any).color
                            : item.color}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-[#001F3F]">Qty: {item.quantity}</span>
                          <span className="font-medium text-[#001F3F]">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    <CreditCard className="h-4 w-4 text-[#001F3F]" />
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
                  <p className="text-sm text-[#001F3F]">{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p className="text-sm text-[#001F3F]">{order.shippingAddress.address2}</p>
                  )}
                  <p className="text-sm text-[#001F3F]">
                    {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#001F3F]">
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
                    <p className="text-sm text-[#001F3F]">{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && (
                      <p className="text-sm text-[#001F3F]">{order.billingAddress.address2}</p>
                    )}
                    <p className="text-sm text-[#001F3F]">
                      {order.billingAddress.city}, {order.billingAddress.region} {order.billingAddress.postalCode}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#001F3F]">
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
                <p className="text-sm text-[#001F3F] mb-4">
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