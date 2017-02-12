# A bit of history
Some weeks ago I have been implied in a project with [angular2](https://angular.io/) and [typescript](https://www.typescriptlang.org/t). At that time I have just started to study 
[reactive programming](http://reactivex.io/) with [rxJava](https://github.com/ReactiveX/RxJava). I was intent to harness the javascript analogous of rxJava - [rxJs](https://github.com/Reactive-Extensions/RxJS).  

For one of my tasks I needed the option of buffering the event stream by count and by time.
I found such a functionality  in [rxJs](https://github.com/Reactive-Extensions/RxJS).
I was happy and my happiness had not lasted for a long time.
The [bufferWithTimeOrCount](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/bufferwithtimeorcount.md) operator is valid only for [rxJs](https://github.com/Reactive-Extensions/RxJS) of version up to **5**. Have a look at the [migration page](https://github.com/rgbkrk/RxJS/blob/master/MIGRATION.md) - you won't find this operator there.
Not founding a suitable solution, I implemented on my own this operator.

# The problem
To write an [rxJs](https://github.com/Reactive-Extensions/RxJS) operator using [typescript](https://www.typescriptlang.org/t). The operator should meet the following requirements:

1. The event stream must be buffered by count as with [bufferCount](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-bufferCount) operator
2. The event stream must be buffered by time as with [bufferTime](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-bufferTime) operator
3. Empty buffers must not be sent.
4. First and second conditions must be joined with logical **OR**. So, the operator will send the buffer only if it has the necessary count of events or it is just too old to wait for other events.

# 1. Standard examples

## 1.1 Interval observable

```
Rx.Observable
  .interval(200)   //every 200 ms
  .subscribe(
     console.log, //onNext
     console.log,  //onError
     () => console.log("completed") //completed
  )
```
You should get the output 
```
0
1
2
... //and so on
```

## 1.2 Buffering by count
```
Rx.Observable
  .interval(200)   //every 200 ms
  .bufferCount(3) //group the events in the 3-dimensional arrays
  .subscribe(
      console.log, //onNext
      console.log,  //onError
      () => console.log("completed") //completed
    )
```
You should get the output
```
[ 0, 1, 2 ]
[ 3, 4, 5 ]
[ 6, 7, 8 ]
...//and so on
```

## 1.3 Buffering by time
 ```
 Rx.Observable
  .interval(200)   //every 200 ms
  .bufferTime(500)  //group the events every 500 ms
  .subscribe(
      console.log, //onNext
      console.log,  //onError
      () => console.log("completed") //completed
  )
 ```
You should get the output
```
[ 0, 1 ]
[ 2, 3, 4 ]
[ 5, 6 ]
...//and so on
```

# 2 Basic steps of creating rxJs operatos
The development process of rxJs operators via typescript should contain the steps

1. Create the operator function
2. Register the operator function in node.js
3. Register the operator function in typescript

Let's describe each step.

## 2.1. Create the operator function. 
The operator function should return an [Observable interface](https://github.com/ReactiveX/rxjs/blob/master/src/Observable.ts). The context of the operator function is the caller observable, named further **the source Observable**. The events come from the source Observable, are being transformed by our operator function and sent further.
```
function opName<T>(): Observable<T> { /*some stuff*/ }
```
## 2.2 Register the operator function in javascript:
The operator function should be added in the prototype of Observable
```
Observable.prototype.opName = opName;
```
## 2.3 Register the operator function in typescript:
The idea is based on the possibility of [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) in typescript. The Observable interface should be enriched with the declaration of the new operator function.
```
declare module "rxjs/Observable" {
     interface Observable<T> {
         opName: typeof opName;
     }
 }
```
## 2.4 `bufferWithTimerOrCount` operator
It is a simple proxy function returning the source Observable. We have only defined a transition place for the events from the source Observable. Nothing fancy. 
```
function bufferWithTimerOrCount<T>(): Observable<T> {
     return this;
 }
```
## 2.5 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/90e7f392d9bbec790b585e9e46435804fa3ef3b6)


# 3 Developing the rxJs operator by direct subscribing
## 3.1 A simple implementation
The proxy operator is ok, but I need to process somehow the events and send them further. One approach is the direct subscribing to the source Observable.
```
function myOperator<T>(): Observable<T> {
  let source: Observable<T> = this;
  return Observable.create(
              subscriber => {
                  source.subscribe( // 1. subscribe to the source Observable
                      event => {
                          let processedEvent = process(event); //2. process the event
                          subscriber.next(processedEvent); //3. send the processed event further
                      },
                      err => {
                          //custom stuff
                          subscriber.error(err); //4. propagate the error
                      },
                      () => {
                         //custom stuff
                        subscriber.completed(); //5. propagate the completion
                      }
                  );
              }
  );
}
```
The key points are: 

1. Subscribe to the source Observable
2. Process the event
3. Send the processed event further
4. Propagate the error
5. Propagate the completion

## 3.5 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/5a23bc46adb23ae648a5132b27133cd1b07117de)

# 4. Developing the rxJs operator by subscribing an Observer interface

## 4.1 Description
We saw how to process events and send the results further using the callbacks at subscribing. If the logic of processing of events is complicated we will look for developing through classes, not callbacks. Another approach is by subscribing an `Observer` interface to the source Observable.
```
interface Observer<T> {
  closed?: boolean;
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
```
The code pattern will be
```
function customOperator<T>(bufferSize: number): Observable<T> {
    let source: Observable<T> = this;
    return Observable.create(subscriber => source.subscribe( new ObserverImplemention()) );
}

class ObserverImplementation<T> implements Observer<T> {/*stuff*/}
```

## 4.2 `BufferWithTimerOrCountOperator` operator
Pay attention how the `subscriber` is passed as an argument to the class constructor. You should remember the `subscriber` is the transport agent of the events further in the pipe.
```
class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; 

    constructor(private subscriber) { } //1. pass the subscribe to the constructor

    public next(event: T): void {
        let processedEvent = this.process(event); //2. process the event
        this.subscriber.next(value);  //3. send the processed event further
    }

    public error(err: any): void {
        this.subscriber.error(err); //4. propagate the error
    }

    public complete(): void {
        this.subscriber.complete(); //5. propagate the completion
    }
    
    private process(event: T): T {/*stuff*/}
}
```
The key points are: 

1. Pass the subscribe to the constructor
2. Process the event
3. Send the processed event further
4. Propagate the error
5. Propagate the completion


## 4.3 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/ea0e1e74615ec721d5191e79968eea2ffd5a9ee4)

# 5. Adding buffer functionality
The problem has been to create an operator containing buffering by count and by time at the same time. I will firstly implement the buffering by count functionality. 

## 5.1 Implementation
```
class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; 
    private list: Array<T>;

    constructor(private subscriber: Subscriber<Array<T>>, private bufferSize: number) { //1. bufferSize parameter is added
        this.list = new Array<T>();
    }

    public next(value: T): void {
        this.list.push(value); //2.i collect the events in the field `list`
     
     //2.ii to send buffer to subscriber if it's full
     if(this.list.length >= this.bufferSize) {
            let list = this.list;
            this.list = new Array<T>(); //start new buffer
            this.subscriber.next(list); //send the full buffer
        }
    }


    public error(err: any): void {
        //3. On error send firstly the existent events
        if(this.list.length) {
            this.subscriber.next(this.list); //send firstly the existent values
        }

        this.subscriber.error(err);
    }

    public complete(): void {
        //4. On complete send firstly the existent events
        if(this.list.length) {
            this.subscriber.next(this.list); //send firstly the existent values
        }

        this.subscriber.complete();
    }
}
```

The key points of I paid attention were

1. The `bufferSize` parameter is added to the constructor of operator class BufferWithTimerOrCountOperator<T>`
2. The `next` method has two meanings
  1. to collect the events in the field `list` 
  2. to send buffer to subscriber if it's full
3. On error send firstly the existent events
4. On complete send firstly the existent events

# 5.2 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/8e0c8c4ca9b4f86c60f82e592dd53eb8fede5041)
You should get the output
```
[ 0, 1, 2 ]
[ 3, 4, 5 ]
[ 6, 7, 8 ]
... //and so on
```

# 6 Refactor

## 6.1 Drain function

The `next`, `error` and `complete` methods send the buffered events, each on its own way. Let's collect the common logic in the `drain` method

```
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
```

## 6.2 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/acac353df63f0e83f1525499b804f4e427458322)

# 7 Adding timer functionality
I have implemented a `CustomTimer` class. You can find it in the source code. It meet the requirements

1. Run a custom callback in a custom context at timeouts
2. Start functionality
3. Stop functionality
4. Reset functionality

## 7.1 Implementation
```
class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    closed: boolean = false; 
    private list: Array<T>;
    private timer: CustomTimer<T>; //1. add custom timer

    constructor(private subscriber: Subscriber<Array<T>>, private bufferSize: number, timeFrame: number) {
        this.list = new Array<T>();
        this.timer = new CustomTimer(this, this.drain, timeFrame);
    }

    public next(value: T): void {
        if(this.list.length == 0) this.timer.restart(); //2. on very new event in the buffer the timer restart

        this.list.push(value);
        if(this.list.length >= this.bufferSize) {
            this.drain();
        }
    }

    private drain() : void {
            if(this.subscriber.closed) {
                this.timer.stop(); //3. if the subscriber is closed stop the timer
                return;
            }
            
            if(this.list.length == 0) return; //no drain

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
```
The key ideas are

1. Add custom timer
2. On very new event in the buffer the timer restart
3. If the subscriber is closed stop the timer

## 7.2 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/490444519d57ef7adfcdec45e461c0dd19d27a28)
You should get the output
```
[ 0, 1, 2 ]
[ 3, 4, 5 ]
[ 6, 7, 8 ]
... //and so on
```

# 8 Last changes

## 8.1 `Close` method and `closed` parameter
```
class BufferWithTimerOrCountOperator<T> implements Observer<T> {
    private drain() : void {
        if(this.subscriber.closed) {
            this.closed = true; //1. if the subscriber is closed, the `closed` param is setted to true and the source Observable will send no more events
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

    private _close(): void { //2. collect the closing functionality in one method
        this.closed = true;
        this.drain();
        this.timer.stop();
    }
}
```
The key ideas are

1. If the subscriber is closed, the `closed` param is set to true and the source Observable will send no more events
2. Collect the closing functionality in one method 

## 8.2 [Try the code by compilig index.ts](https://github.com/smart--petea/RxJsOperatorTutorial/tree/56bbcfb7ff33ced82a9879a26b3ddc51e3a99f0b)

# 9 Used materials

1. The rxJs [opeator creation](https://github.com/ReactiveX/rxjs/blob/master/doc/operator-creation.md) page.
2. The angular2 [source code](https://github.com/angular/angular).
