Some weeks ago I have been implied in a project with angular 2 and typescript. At that time I have just started to study
reactive programming via rxJava. I have started to use the javascript analogous of rxJava - **rxJs**.  One of my
tasks was in need of buffering the event stream by count and by time.
I found such a functionality  in rxJs.
I was happy and my happiness has longing not for a long time.
The [bufferWithTimeOrCount](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/bufferwithtimeorcount.md) operator is valid only for rxJs of version up to **5**. 
Not founding a suitable solution, I tried to implement on my own this operator.
The programming language is typescript. 
You can pursuit the development process with the help of git history. Each git commit is commented. So let's start :)
