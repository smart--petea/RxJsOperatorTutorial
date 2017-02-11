import { Observable } from "rxjs/Observable";

function bufferWithTimerOrCount<T>(): Observable<T> {
    //this is the Observable change by our operator
    let source: Observable<T> = this;
    return Observable.create(subscriber => {
        source.subscribe(
            x => subscriber.next(x),
            err => subscriber.error(err),
            () => subscriber.completed()
        );
    });
}

//Register our function in javascript.
Observable.prototype.bufferWithTimerOrCount = bufferWithTimerOrCount;

//Register in typescript interface. It is required at compile time
declare module "rxjs/Observable" {
    interface Observable<T> {
        bufferWithTimerOrCount: typeof bufferWithTimerOrCount;
    }
}
