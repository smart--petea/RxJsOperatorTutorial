/// <reference path="typings/globals/es6-shim/index.d.ts" />`
import * as Rx from 'rxjs';

Rx.Observable
    .interval(200)   //every 200 ms
    //.bufferCount(3) //group the events in the 3-dimensional arrays
    //.bufferTime(500)  //group the events every 500 ms
    .bufferWithTimeOrCount(500, 3) //Let's implement it!!!
    .subscribe(
        console.log, //onNext
        console.log  //onError
    )

