import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ShoppingBag, Clock, MessageSquare, LineChart } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Marketplace = lazy(() => import('./Marketplace'));
const BuyerOrders = lazy(() => import('./BuyerOrders'));
const Messages = lazy(() => import('./Messages'));
const MarketRatesPage = lazy(() => import('./MarketRatesPage'));
const NotFound = lazy(() => import('./NotFound'));

const navGroups = [
  {
    title: 'Shop',
    items: [
      { label: 'Marketplace', path: '/buyer', icon: ShoppingBag, keywords: 'browse buy eggs birds' },
      { label: 'My Purchases', path: '/buyer/orders', icon: Clock, keywords: 'orders history' },
      { label: 'Messages', path: '/buyer/chat', icon: MessageSquare, keywords: 'chat sellers' },
      { label: 'Market Rates', path: '/buyer/rates', icon: LineChart, keywords: 'prices egg rate' },
    ],
  },
];

export default function BuyerDashboard() {
  return (
    <DashboardLayout navGroups={navGroups} accent="indigo" roleLabel="Buyer account" homePath="/buyer" messagesPath="/buyer/chat">
      <Routes>
        <Route index element={<Marketplace />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="chat" element={<Messages />} />
        <Route path="rates" element={<MarketRatesPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}
