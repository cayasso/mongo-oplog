// Type definitions for [cayasso/mongo-oplog]
// Project: [https://github.com/cayasso/mongo-oplog]
declare type MongoOplogOpEvent = 'delete' | 'insert' | 'op' | 'update';
declare type MongoOplogStatusEvent = 'connected' | 'destroy' | 'end' | 'error' | 'tail';
declare type MongoOplogEvents = MongoOplogOpEvent | MongoOplogStatusEvent;

declare interface MongoOplogFiltered {
    on(evt: MongoOplogOpEvent, cb: (data: any) => void);
    once(evt: MongoOplogOpEvent, cb: (data: any) => void);
    addEventListener(evt: MongoOplogOpEvent, cb: Function): void;
    removeEventListener(evt: MongoOplogOpEvent, cb: Function): void;
    removeAllListeners(evt: MongoOplogOpEvent);
    destroy(): void;
}

interface MongoOplog {
    on(evt: MongoOplogEvents, cb: (data: any) => void);
    once(evt: MongoOplogEvents, cb: (data: any) => void);
    addEventListener(evt: MongoOplogEvents, cb: Function): void;
    removeEventListener(evt: MongoOplogEvents, cb: Function): void;
    removeAllListeners(evt: MongoOplogEvents);

    filter(): MongoOplogFiltered;
    filter(ns: string): MongoOplogFiltered;
    tail(): Promise<ReadableStream>;
    tail(cb: Function): void;
    stop(): Promise<MongoOplog>;
    stop(cb: Function): void;
    destroy(): Promise<MongoOplog>;
    destroy(cb: Function): void;
}

declare module 'mongo-oplog' {
    interface Db { collection: any; }
    interface Options {
        ns?: string;
        since?: number;
        coll?: string;
    }
    interface OptionsExt extends Options {
        [key: string]: any;
    }
    interface MongoOplogStatic {
        (): MongoOplog;
        (uri: string): MongoOplog;
        (uri: string, options: OptionsExt): MongoOplog;
        <T extends Db>(db: T): MongoOplog;
        <T extends Db>(db: T, options: Options): MongoOplog;
    }
    let mod: MongoOplogStatic;
    export = mod;
}
