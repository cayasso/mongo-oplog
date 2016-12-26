// Type definitions for [cayasso/mongo-oplog]
// Project: [https://github.com/cayasso/mongo-oplog]
// Definitions by: [FinalDes] <[https://github.com/FinalDes]>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare function MongoOplog(url:string,filter:any):OplogTrigger;

declare interface OplogTrigger {
    tail(): void
    on(type: String, callback: (doc: any) => void): void;
    end(callback: () => void): void;
    stop(callback: () => void): void
}

declare module "mongo-oplog" {
    export = MongoOplog;
}