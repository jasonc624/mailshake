import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StarWarsService {
  url = 'https://swapi.dev/api/';

  constructor(private http: HttpClient) {
  }

  public getPeople(page?): Observable<any> {
    const pagination = page > 1 ? `/?page=${page}` : '/';
    return this.http.get(this.url + 'people' + pagination);
  }

  public getPlanets(page?): Observable<any> {
    const pagination = page ? `/?page=${page}` : '';
    return this.http.get(this.url + 'planets' + pagination);
  }

  public getFilms(page?): Observable<any> {
    const pagination = page ? `/?page=${page}` : '';
    return this.http.get(this.url + 'films' + pagination);
  }

  public apiFetcher(url: string): Observable<any> {
    return this.http.get(url);
  }

  public search(context, query): Observable<any> {

    return this.http.get(`${this.url}${context.toString()}?search=${query.toString()}`);
  }
}
