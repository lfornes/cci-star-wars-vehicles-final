import {HttpClient} from '@angular/common/http';
import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'table-overview-example',
  styleUrls: ['table-overview-example.css'],
  templateUrl: 'table-overview-example.html',
})
export class TableOverviewExample implements AfterViewInit {
  displayedColumns: string[] = ['name', 'cost_in_credits', 'length'];
  httpDataSource: StarWarsHttpDatabase | null;
  data: Vehicle[] = [];
  inputValue: string;
  resultsLength = 0;
  isLoadingResults = false;
  myControl = new FormControl();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;

  constructor(private _httpClient: HttpClient) {  }

  ngAfterViewInit() {
    if(this.inputValue==undefined || this.searchInput.nativeElement==undefined) {
      this.inputValue='';
      this.searchInput.nativeElement='';
    }

    this.httpDataSource = new StarWarsHttpDatabase(this._httpClient); 

    merge(this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.httpDataSource!.getStarWarsVehicles(this.paginator.pageIndex, this.inputValue)
        }),
        map(data => {
          if (data === null) {
            return [];
          }
          this.resultsLength = data.count;
          this.data=data.results;
          return data.results;
        })
      ).subscribe();
      
    this.myControl.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(() => {
        console.log(this.inputValue);
        this.paginator.pageIndex = 0;
        this.isLoadingResults = true;
        return this.httpDataSource!.getStarWarsVehicles(this.paginator.pageIndex, this.inputValue)
          .pipe(catchError(() => observableOf(null)));
      }),
      map(data => {
        // Flip flag to show that loading has finished.
        if (data === null) {
          return [];
        }
        this.resultsLength = data.count;
        this.data=data.results;
        this.isLoadingResults=false;
        return data.results;
      })
    ).subscribe(); 
  }

applyFilter(event: Event) {
    if (typeof (event.target) == "undefined"){
      return;
    }
    this.inputValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }
}

export interface StarWarsApi {
  results: Vehicle[];
  count: number;
}

export interface Vehicle {
  name: string;
  cost_in_credits: string;
  length: string;
}

export class StarWarsHttpDatabase {
  constructor(private _httpClient: HttpClient) {}

  getStarWarsVehicles(page: number, filter: string): Observable<StarWarsApi> {
    const href = 'https://swapi.dev/api/vehicles/';
    const requestUrl =`${href}?format=json&sort&page=${page+1}&search=${filter};`
    return this._httpClient.get<StarWarsApi>(requestUrl);
  }
 
}

/**  Copyright 2021 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */