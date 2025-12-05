import { usePolkadot } from '@/context/PolkadotContext';
import { useRide } from '@/context/RideContext';

export default function CustomerDashboard() {
  const { account, createOrderOnChain } = usePolkadot();
  const { activeRide, setActiveRide } = useRide();

  const handleCreateRide = async () => {
    try {
      // 1. Create ride in backend
      const rideResponse = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: account,
          pickupLat: 28.7041,
          pickupLng: 77.1025,
          dropoffLat: 28.5355,
          dropoffLng: 77.3910,
          estimatedFare: 250,
          stakedAmount: 287.5,
        }),
      });
      const ride = await rideResponse.json();

      // 2. Lock escrow on Polkadot
      const escrowResult = await createOrderOnChain(
        ride.id,
        287500000000000, // 287.5 in planck (10^12)
        account
      );

      // 3. Confirm escrow with backend
      await fetch(`/api/orders/${ride.id}/lock-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: escrowResult.transactionHash,
          amount: 287500000000000,
        }),
      });

      toast.success('✅ Ride created! Escrow locked.');
      setActiveRide(ride);
    } catch (error) {
      toast.error('Failed to create ride');
    }
  };

  return (
    <div>
      <button onClick={handleCreateRide} className="btn btn--primary">
        Create Ride
      </button>
    </div>
  );
}
