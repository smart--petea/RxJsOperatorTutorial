import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";

function bufferWithTimerOrCount<T>(bufferSize: number): Observable<T> {
    //this is the Observable change by our operator
    let source: Observable<T> = this;
    return Observable.create((subscriber: Subscriber<Array<T>>) => {
        source.subscribe( new BufferWithTimerOrCountOperator(subscriber, bufferSize) );
    });
}

class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; //the operator is open. If it is true, the oservable will not emit events to this subscriber
    private list: Array<T>;

    constructor(private subscriber: Subscriber<Array<T>>, private bufferSize: number) {
        this.list = new Array<T>();
    }

    public next(value: T): void {
        this.list.push(value);
        if(this.list.length >= this.bufferSize) {
            this.drain();
        }
    }

    private drain() : void {
            let list = this.list;
            this.list = new Array<T>(); //start new buffer
            this.subscriber.next(list); //send the full buffer
    }


    public error(err: any): void {
        if(this.list.length) {
            this.drain(); //drain firstly the existent values
        }

        this.subscriber.error(err);
    }

    public complete(): void {
        if(this.list.length) {
            this.drain(); //drain firstly the existent values
        }

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
