import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {merge, of} from 'rxjs';
import {StarWarsService} from '../star-wars.service';
import {MatSort, Sort} from '@angular/material/sort';
import {FormControl} from '@angular/forms';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {catchError, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../base.component';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent extends BaseComponent implements AfterViewInit, OnChanges {
  displayedColumns: string[] = ['name', 'home', 'dob', 'film'];

  // @ts-ignore
  sortFilter: any = {
    active: 'name',
    direction: 'asc',
  };
  page: Partial<PageEvent> = {
    previousPageIndex: null,
    pageIndex: 0,
    pageSize: 10
  };

  data;
  next;
  count;
  isLoading = false;
  cachedPeople = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Input() filters;
  goTo = new FormControl(1);

  constructor(private sw: StarWarsService) {
    super();
  }

  private findNextPageOf(url): number {
    // Gets the Url next page as a number to use later
    if (!url.next) {
      return null;
    }
    return parseInt(url.next.substring(url.next.length - 1), 0);
  }

  private existsInCache(page): any {
    // Page is the current paginator number
    if (!this.cachedPeople.length) {
      // No ones cached yet
      return null;
    }
    return this.cachedPeople.find(cached => {
      const findPage = this.findNextPageOf(cached);
      // Finds the cached result whos next page is the current paginator request
      const exists = findPage === page + 1;
      return exists ? cached : null;
    });
  }

  private formatPerson(person): any {
    const personMovies = [];
    this.sw.apiFetcher(person.homeworld)
      .pipe(
        tap((homeworld) => person.home = homeworld),
        this.unsubscribeOnDestroy)
      .subscribe();
    if (person.films && person.films.length) {
      person?.films.forEach(filmUrl => {
        this.sw.apiFetcher(filmUrl)
          .pipe(
            tap((filmArr) => personMovies.push(filmArr)),
            this.unsubscribeOnDestroy)
          .subscribe();
        person.movies = personMovies;
      });
    }
    return person;
  }

  compare(a: number | string, b: number | string, isAsc: boolean): any {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  sortPage(page): any {
    const toBeSorted = page.results.slice();
    const property = this.sortFilter.active;
    const direction = this.sortFilter.direction;
    const isAsc = direction === 'asc';
    page.results = toBeSorted.sort((a, b) => {
      switch (property) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'home':
          return this.compare(a.home, b.home, isAsc);
        case 'film':
          return this.compare(a.films.length, b.films.length, isAsc);
        case 'dob':
          return this.compare(parseInt(a['birth_year'],0), parseInt(b['birth_year'],0), isAsc);
        default:
          return 0;
      }
    });
    return page;
  }

  ngAfterViewInit(): void {
    this.goTo.valueChanges.subscribe(go => {

      if (go < 9) {
        this.page.pageIndex = go;
        this.paginator.pageIndex = go;
        this.init();
      }
    });
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.filters) {
      if (this.paginator) {
        this.init();
      }
    }
  }

  init(): void {
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap((sort, paginator) => {
          if (sort['direction']) {
            this.sortFilter = sort;
          }
          this.isLoading = true;
          const page = this.page.pageIndex + 1;
          return !!this.existsInCache(page) ? of(this.existsInCache(page)) : this.sw.getPeople(page);
        }),
        map(data => {
          // Mutates data to use in view
          if (data.results[0].movies) {
            // every other run
            return this.sortPage(data);
          }
          data.results.map(person => {
            return this.formatPerson(person);
          });
          // first run
          return this.sortPage(data);
        }),
        tap((people) => {
          // Caches page and Prepares the next page
          if (!this.cachedPeople.includes(people)) {
            this.cachedPeople.push(people);
          }
          if (people.next && people.next.length) {
            this.sw.apiFetcher(people.next).subscribe((next) => {
              if (this.cachedPeople.includes(next)) {
                // Already cached this page.
                return;
              }
              next.results.map(person => {
                return person.movies ? person : this.formatPerson(person);
              });
              this.cachedPeople.push(next);
            });
          }
        }),
        catchError((error) => {
          this.isLoading = false;
          return of([]);
        }),
        this.unsubscribeOnDestroy
      ).subscribe(data => {
      this.isLoading = false;
      this.data = data.results.filter(person => {
        if (this.filters.type === 'people' && this.filters.query.length) {
          return person.name.toLowerCase().indexOf(this.filters.query) > -1;
        }
        if (this.filters.type === 'films' && this.filters.query.length) {
          const featured = [];
          person?.movies.forEach(movie => {
            if (movie.title.toLowerCase().indexOf(this.filters.query) > -1) {
              featured.push(movie);
            }
          });
          if (featured.length) {
            return person;
          }
        }
        if (this.filters.type === 'planets' && this.filters.query.length) {
          return person?.home?.name.toLowerCase().indexOf(this.filters.query) > -1;
        }
        return person;
      });
      this.count = data.count;
    });
  }
}
