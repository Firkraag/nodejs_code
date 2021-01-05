// try {
//     module.exports = Promise
// } catch (e) { }

function Promise(executor) {
    const self = this

    self.status = 'pending'
    self.onResolvedCallback = []
    self.onRejectedCallback = []

    function resolve(value) {
        if (value instanceof Promise) {
            return value.then(resolve, reject)
        }
        setTimeout(function () { // 异步执行所有的回调函数
            if (self.status === 'pending') {
                self.status = 'resolved'
                self.data = value
                for (let i = 0; i < self.onResolvedCallback.length; i++) {
                    self.onResolvedCallback[i](value)
                }
            }
        })
    }

    function reject(reason) {
        setTimeout(function () { // 异步执行所有的回调函数
            if (self.status === 'pending') {
                self.status = 'rejected'
                self.data = reason
                for (let i = 0; i < self.onRejectedCallback.length; i++) {
                    self.onRejectedCallback[i](reason)
                }
            }
        })
    }

    try {
        executor(resolve, reject)
    } catch (reason) {
        reject(reason)
    }
}
function resolvePromise(promise2, x, resolve, reject) {
    let then
    let thenCalledOrThrow = false

    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise!'))
    }

    if (x instanceof Promise) {
        if (x.status === 'pending') { //because x could resolved by a Promise Object
            x.then(function (v) {
                resolvePromise(promise2, v, resolve, reject)
            }, reject)
        } else { //but if it is resolved, it will never resolved by a Promise Object but a static value;
            x.then(resolve, reject)
        }
        return
    }

    if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
        try {
            then = x.then //because x.then could be a getter
            if (typeof then === 'function') {
                then.call(x, function rs(y) {
                    if (thenCalledOrThrow) return
                    thenCalledOrThrow = true
                    // console.log("y = ", y)
                    return resolvePromise(promise2, y, resolve, reject)
                }, function rj(r) {
                    if (thenCalledOrThrow) return
                    thenCalledOrThrow = true
                    return reject(r)
                })
            } else {
                resolve(x)
            }
        } catch (e) {
            if (thenCalledOrThrow) return
            thenCalledOrThrow = true
            return reject(e)
        }
    } else {
        resolve(x)
    }
}
Promise.prototype.then = function (onResolved, onRejected) {
    let self = this
    let promise2
    onResolved = typeof onResolved === 'function' ? onResolved : function (v) {
        return v
    }
    onRejected = typeof onRejected === 'function' ? onRejected : function (r) {
        throw r
    }

    if (self.status === 'resolved') {
        return promise2 = new Promise(function (resolve, reject) {
            setTimeout(function () { // 异步执行onResolved
                try {
                    let x = onResolved(self.data)
                    resolvePromise(promise2, x, resolve, reject)
                } catch (reason) {
                    reject(reason)
                }
            })
        })
    }

    if (self.status === 'rejected') {
        return promise2 = new Promise(function (resolve, reject) {
            setTimeout(function () { // 异步执行onRejected
                try {
                    let x = onRejected(self.data)
                    resolvePromise(promise2, x, resolve, reject)
                } catch (reason) {
                    reject(reason)
                }
            })
        })
    }
    if (self.status === 'pending') {
        // 这里之所以没有异步执行，是因为这些函数必然会被resolve或reject调用，而resolve或reject函数里的内容已是异步执行，构造函数里的定义
        return promise2 = new Promise(function (resolve, reject) {
            self.onResolvedCallback.push(function (value) {
                try {
                    let x = onResolved(value)
                    resolvePromise(promise2, x, resolve, reject)
                } catch (r) {
                    reject(r)
                }
            })

            self.onRejectedCallback.push(function (reason) {
                try {
                    let x = onRejected(reason)
                    resolvePromise(promise2, x, resolve, reject)
                } catch (r) {
                    reject(r)
                }
            })
        })
    }
}

Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
}

// Promise.deferred = Promise.defer = function () {
//     let dfd = {}
//     dfd.promise = new Promise(function (resolve, reject) {
//         dfd.resolve = resolve
//         dfd.reject = reject
//     })
//     return dfd
// }
function resolved(value) {
    return new Promise((resolve) => {
        resolve(value);
    })
}
module.exports.resolved = resolved
// 返回一个rejected的Promise, data为reason
function rejected(reason) {
    return new Promise((resolve, reject) => {
        reject(reason);
    })
}
module.exports.rejected = rejected
function deferred(value) {
    const deferred = {};
    const promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    })
    deferred.promise = promise;
    return deferred;
}
module.exports.deferred = deferred
// function yFactory() {
//     // return outerThenableFactory(innerThenableFactory(sentinel));
//     let sentinel = { sentinel: "sentinel" }; // a sentinel fulfillment value to test for with strict equality
//     return resolved({
//         then: function (onFulfilled) {
//             onFulfilled(sentinel);
//         }
//     })
// }
// function xFactory() {
//     return {
//         then: function (resolvePromise) {
//             resolvePromise(yFactory());
//         }
//     };
// }
// let promise = resolved(1).then(function onBasePromiseFulfilled() {
//     return xFactory();
// });
// promise.then(function onPromiseFulfilled(value) {
//     console.log(value);
// });