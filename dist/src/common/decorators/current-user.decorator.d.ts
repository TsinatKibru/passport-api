export interface JwtPayload {
    sub: string;
    email: string;
    role: 'ADMIN' | 'STAFF';
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
