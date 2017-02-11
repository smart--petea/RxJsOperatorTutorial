/// <reference path="typings/globals/es6-shim/index.d.ts" />`
import * as Rx from 'rxjs';

Rx.Observable
    .interval(200)   //every 200 ms
    .subscribe(
        console.log, //onNext
        console.log  //onError
    )

