import {Component, OnDestroy} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

// Does not need decorator but satisfies angular compiler
@Component({
  template: ''
})
export class BaseComponent implements OnDestroy {
  ngUnsubscribe = new Subject();

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  protected unsubscribeOnDestroy = (source: Observable<any>): Observable<any> => {
    return source.pipe(
      takeUntil(this.ngUnsubscribe)
    );
  };
}
