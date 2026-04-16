export interface TopEvent {
    eventId: number;
    title: string;
    registrationCount: number;
}

export interface EventStats {
    totalInscribed: number;
    totalAttended: number;
    attendanceRate: number;
    averageRating: number;
    discoverySourceDistribution: { [key: string]: number };
    genderDistribution: { [key: string]: number };
    specialtyDistribution: { [key: string]: number };
    paymentMethodDistribution: { [key: string]: number };
    participationModeDistribution: { [key: string]: number };
    topEvents?: TopEvent[];
}
