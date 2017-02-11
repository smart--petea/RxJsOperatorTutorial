import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";

function bufferWithTimerOrCount<T>(bufferSize: number, timeFrame: number): Observable<T> {
    //this is the Observable change by our operator
    let source: Observable<T> = this;
    return Observable.create((subscriber: Subscriber<Array<T>>) => {
        source.subscribe( new BufferWithTimerOrCountOperator(subscriber, bufferSize, timeFrame) );
    });
}

class CustomTimer<T> {
    private rawTimer = null; //node.js Timeout object

    constructor(private operator: BufferWithTimerOrCountOperator<T>, private clbk: () => void, private timeFrame: number ) { }

    public start() {
        this.rawTimer = setTimeout(
            () => { this.clbk.call(this.operator); },
            this.timeFrame
        );
    }

    public stop() {
        if(this.rawTimer == null) return;

        clearTimeout(this.rawTimer);
        this.rawTimer = null;
    }

    public restart() {
        this.stop();
        this.start();
    }
}

class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; //the operator is open. If it is true, the oservable will not emit events to this subscriber
    private list: Array<T>;
    private timer: CustomTimer<T>;

    constructor(private subscriber: Subscriber<Array<T>>, private bufferSize: number, timeFrame: number) {
        this.list = new Array<T>();
        this.timer = new CustomTimer(this, this.drain, timeFrame);
    }

    public next(value: T): void {
        if(this.list.length == 0) this.timer.restart();

        this.list.push(value);
        if(this.list.length >= this.bufferSize) {
            this.drain();
        }
    }

    private drain() : void {
        if(this.subscriber.closed) {
            this.closed = true;
            this.timer.stop();
            return;
        }

        if(this.list.length == 0) return; //no drain

        let list = this.list;
        this.list = new Array<T>(); //start new buffer
        this.subscriber.next(list); //send the full buffer
    }

    public error(err: any): void {
        this._close();
        this.subscriber.error(err);
    }

    public complete(): void {
        this._close();
        this.subscriber.complete();
    }

    private _close(): void {
        this.closed = true;
        this.drain();
        this.timer.stop();
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
