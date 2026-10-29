import OrdersList from '../components/OrdersList';
import SalesPanel from '../components/SalesPanel';

export default function BuyerOrders() {
  return (
    <div className="space-y-8">
      <OrdersList perspective="buyer" />
      <SalesPanel role="Buyer" />
    </div>
  );
}
