export interface CommonResponse<T>{
    code: number
    message: string,
    data: T
}

export interface Location {
    id: bigint
    name: string,
    longitude: number
    latitude: number
    
}