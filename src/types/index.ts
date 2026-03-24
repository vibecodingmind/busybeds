export type UserRole = 'traveler' | 'hotel_owner' | 'hotel_manager' | 'admin';
export type CouponStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type HotelStatus = 'active' | 'inactive' | 'pending';

export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}
