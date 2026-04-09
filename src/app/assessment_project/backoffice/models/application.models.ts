export enum Level {
    A1 = 'A1',
    A2 = 'A2',
    B1 = 'B1',
    B2 = 'B2',
    C1 = 'C1',
    C2 = 'C2'
}

export enum ApplicationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export interface JobOffer {
    id: number;
    title: string;
    description: string;
    requiredLevel: Level;
    active: boolean;
}

export interface Application {
    id: number;
    status: ApplicationStatus;
    userId: number;
    jobOffer: JobOffer;
}
