import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";

function bufferWithTimerOrCount<T>(): Observable<T> {
    //this is the Observable change by our operator
    let source: Observable<T> = this;
    return Observable.create(subscriber => {
        source.subscribe( new BufferWithTimerOrCountOperator(subscriber) );
    });
}

class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; //the operator is open. If it is true, the oservable will not emit events to this subscriber

    constructor(private subscriber) { }

    public next(value: T): void {
        this.subscriber.next(value);
    }


    public error(err: any): void {
        this.subscriber.error(err);
    }

    public complete(): void {
        this.subscriber.complete();
    }
}

//Register our function in javascript.
Observable.prototype.bufferWithTimerOrCount = bufferWithTimerOrCount;

//Register in typescript interface. It is required at compile time
declare module "rxjs/Observable" {
    interface Observable<T> {
        bufferWithTimerOrCount: typeof bufferWithTimerOrCount;
    }
}
