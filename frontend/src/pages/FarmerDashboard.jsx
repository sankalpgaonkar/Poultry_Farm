import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, Calculator, Package, Users, ShoppingBag, Store, MessageSquare,
  ShoppingCart, Truck, Cpu, Layers, Radar, Bot,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import AIAssistant from '../components/AIAssistant';

// Each tool is its own download; charts (Recharts) load only on the pages that draw them.
const DashboardOverview = lazy(() => import('./DashboardOverview'));
const FarmManagement = lazy(() => import('./FarmManagement'));
const Marketplace = lazy(() => import('./Marketplace'));
const FarmerOrders = lazy(() => import('./FarmerOrders'));
const EggPrediction = lazy(() => import('./EggPrediction'));
const HealthIntelligence = lazy(() => import('./HealthIntelligence'));
const ProfitAnalyzer = lazy(() => import('./ProfitAnalyzer'));
const Inventory = lazy(() => import('./Inventory'));
const Community = lazy(() => import('./Community'));
const SmartFeatures = lazy(() => import('./SmartFeatures'));
const FarmStore = lazy(() => import('./FarmStore'));
const FarmerStoreManager = lazy(() => import('./FarmerStoreManager'));
const SupplyTracking = lazy(() => import('./SupplyTracking'));
const Messages = lazy(() => import('./Messages'));
const NotFound = lazy(() => import('./NotFound'));

const navGroups = [
  {
    title: 'Daily farm work',
    items: [
      { label: 'Dashboard', path: '/farmer', icon: LayoutDashboard, keywords: 'home overview weather rates' },
      { label: 'My Farm Data', path: '/farmer/manage', icon: Layers, keywords: 'farm eggs log record' },
      { label: 'Feed & Supplies', path: '/farmer/inventory', icon: Package, keywords: 'inventory stock feed medicine' },
    ],
  },
  {
    title: 'Bird health & AI',
    items: [
      { label: 'Check Health', path: '/farmer/health', icon: Stethoscope, keywords: 'disease symptoms' },
      { label: 'Egg Prediction', path: '/farmer/predict', icon: Cpu, keywords: 'forecast yield' },
      { label: 'My Earnings', path: '/farmer/profit', icon: Calculator, keywords: 'profit money finance' },
      { label: 'Advanced Tools', path: '/farmer/smart', icon: Radar, keywords: 'schemes buyers report' },
    ],
  },
  {
    title: 'Buy & sell',
    items: [
      { label: 'Marketplace', path: '/farmer/listings', icon: ShoppingBag, keywords: 'sell listing' },
      { label: 'Your Orders', path: '/farmer/orders', icon: ShoppingCart, keywords: 'orders buyers' },
      { label: 'Messages', path: '/farmer/messages', icon: MessageSquare, keywords: 'chat buyers' },
      { label: 'My Store', path: '/farmer/my-store', icon: Store, keywords: 'shop products' },
      { label: 'Farm Store', path: '/farmer/store', icon: ShoppingBag, keywords: 'buy supplies' },
      { label: 'Track Deliveries', path: '/farmer/supplies', icon: Truck, keywords: 'delivery supplies' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Farmer Groups', path: '/farmer/community', icon: Users, keywords: 'posts community' },
      { label: 'Kisan Mitra AI', path: '/farmer/ai', icon: Bot, keywords: 'assistant chat ai' },
    ],
  },
];

export default function FarmerDashboard() {
  return (
    <DashboardLayout navGroups={navGroups} roleLabel="Farmer account" homePath="/farmer" messagesPath="/farmer/messages">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="health" element={<HealthIntelligence />} />
        <Route path="profit" element={<ProfitAnalyzer />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="predict" element={<EggPrediction />} />
        <Route path="smart" element={<SmartFeatures />} />
        <Route path="community" element={<Community />} />
        <Route path="manage" element={<FarmManagement />} />
        <Route path="listings" element={<Marketplace />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="messages" element={<Messages />} />
        <Route path="store" element={<FarmStore />} />
        <Route path="my-store" element={<FarmerStoreManager />} />
        <Route path="supplies" element={<SupplyTracking />} />
        <Route path="ai" element={<AIAssistant isStatic />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}
