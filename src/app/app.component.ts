import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {debounceTime, filter, switchMap, tap} from 'rxjs/operators';
import {StarWarsService} from './star-wars.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mailshake';
  items = new FormControl('people');
  query = new FormControl('');
  results;
  queryType;
  optionList = [
    {title: 'Name', value: 'people'},
    {title: 'World', value: 'planets'},
    {title: 'Film', value: 'films'}
  ];

  constructor(private sw: StarWarsService) {
  }

  ngOnInit(): void {
    this.queryType = {
      type: this.items.value,
      query: this.query.value
    };
    this.query.valueChanges.pipe(
      debounceTime(500),
      switchMap((str) => {
        return this.sw.search(this.items.value, str);
      })
    ).subscribe((res) => {
      this.results = res;
    });
  }

  load() {
    this.queryType = {
      type: this.items.value,
      query: this.query.value ? this.query.value.toLowerCase() : this.query.value
    };
  }
}
