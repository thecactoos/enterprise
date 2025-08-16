import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache';
export const Cache = (ttl: number) => SetMetadata(CACHE_KEY, { ttl });