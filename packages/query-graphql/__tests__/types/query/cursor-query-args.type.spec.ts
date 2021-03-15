// eslint-disable-next-line max-classes-per-file
import { SortDirection, SortNulls } from '@nestjs-query/core';
import {
  Args,
  ArgsType,
  Float,
  GraphQLISODateTime,
  GraphQLTimestamp,
  ID,
  Int,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FilterableField, PagingStrategies, QueryArgsType } from '../../../src';
import {
  cursorQueryArgsFilterRequiredTypeSDL,
  cursorQueryArgsOptionsTypeSDL,
  cursorQueryArgsTypeSDL,
  expectSDL,
} from '../../__fixtures__';

describe('Cursor paging strategy QueryArgsType with manual options', (): void => {
  afterEach(() => jest.clearAllMocks());

  @ObjectType('TestQuery')
  class TestDto {
    @FilterableField(() => ID)
    idField!: number;

    @FilterableField(() => ID, { nullable: true })
    idFieldOption?: number;

    @FilterableField()
    stringField!: string;

    @FilterableField({ nullable: true })
    stringFieldOptional?: string;

    @FilterableField()
    booleanField!: boolean;

    @FilterableField({ nullable: true })
    booleanFieldOptional?: boolean;

    @FilterableField()
    numberField!: number;

    @FilterableField({ nullable: true })
    numberFieldOptional?: number;

    @FilterableField(() => Float)
    floatField!: number;

    @FilterableField(() => Float, { nullable: true })
    floatFieldOptional?: number;

    @FilterableField(() => Int)
    intField!: number;

    @FilterableField(() => Int, { nullable: true })
    intFieldOptional?: number;

    @FilterableField(() => GraphQLTimestamp)
    timestampField!: Date;

    @FilterableField(() => GraphQLTimestamp, { nullable: true })
    timestampFieldOptional?: Date;

    @FilterableField(() => GraphQLISODateTime)
    date!: Date;

    @FilterableField(() => GraphQLISODateTime, { nullable: true })
    dateOptional?: Date;
  }

  @ObjectType()
  class TestFilterRequiredDto {
    @FilterableField({ filterRequired: true })
    requiredFilterableField!: string;
  }
  @ArgsType()
  class TestCursorQuery extends QueryArgsType(TestDto, { pagingStrategy: PagingStrategies.CURSOR }) {}

  it('create a query for string fields', async () => {
    @Resolver()
    class TestCursorQueryResolver {
      @Query(() => String)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      test(@Args() query: TestCursorQuery): string {
        return 'hello';
      }
    }
    return expectSDL([TestCursorQueryResolver], cursorQueryArgsTypeSDL);
  });

  it('should transform paging to the correct instance of paging', () => {
    const queryObj: TestCursorQuery = {
      paging: {
        first: 10,
        after: 'YXJyYXljb25uZWN0aW9uOjEw',
      },
    };
    const queryInstance = plainToClass(TestCursorQuery, queryObj);
    expect(validateSync(queryInstance)).toEqual([]);
    expect(queryInstance.paging).toBeInstanceOf(TestCursorQuery.PageType);
  });

  it('should sorting to the correct instance of sorting', () => {
    const queryObj: TestCursorQuery = {
      sorting: [{ field: 'stringField', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
    };
    const queryInstance = plainToClass(TestCursorQuery, queryObj);
    expect(validateSync(queryInstance)).toEqual([]);
    expect(queryInstance.sorting![0]).toBeInstanceOf(TestCursorQuery.SortType);
  });

  it('should make filter to the correct instance of sorting', () => {
    const queryObj: TestCursorQuery = {
      filter: {
        stringField: { eq: 'foo' },
      },
    };
    const queryInstance = plainToClass(TestCursorQuery, queryObj);
    expect(validateSync(queryInstance)).toEqual([]);
    expect(queryInstance.filter).toBeInstanceOf(TestCursorQuery.FilterType);
  });

  it('should make the filter required if there is a filterRequired field', () => {
    @ArgsType()
    class TestFilterRequiredQuery extends QueryArgsType(TestFilterRequiredDto) {}

    @Resolver()
    class TestFilterRequiredResolver {
      @Query(() => String)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      test(@Args() query: TestFilterRequiredQuery): string {
        return 'hello';
      }
    }
    return expectSDL([TestFilterRequiredResolver], cursorQueryArgsFilterRequiredTypeSDL);
  });

  describe('options', () => {
    @ArgsType()
    class CursorQueryOptionsArgs extends QueryArgsType(TestDto, {
      pagingStrategy: PagingStrategies.CURSOR,
      defaultResultSize: 2,
      maxResultsSize: 5,
      defaultFilter: { booleanField: { is: true } },
      defaultSort: [{ field: 'booleanField', direction: SortDirection.DESC }],
    }) {}

    it('allow apply the options to the generated SDL', () => {
      @Resolver()
      class TestCursorQueryManualOptionsResolver {
        @Query(() => String)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        test(@Args() query: CursorQueryOptionsArgs): string {
          return 'hello';
        }
      }
      return expectSDL([TestCursorQueryManualOptionsResolver], cursorQueryArgsOptionsTypeSDL);
    });

    it('allow validate a maxResultsSize for paging.first', () => {
      const queryObj: TestCursorQuery = {
        paging: { first: 10 },
      };
      const queryInstance = plainToClass(CursorQueryOptionsArgs, queryObj);
      expect(validateSync(queryInstance)).toEqual([
        {
          children: [],
          constraints: {
            PropertyMax: 'Field paging.first max allowed value is `5`.',
          },
          property: 'paging',
          target: queryObj,
          value: queryObj.paging,
        },
      ]);
    });

    it('allow validate a maxResultsSize for paging.last', () => {
      const queryObj: TestCursorQuery = {
        paging: { last: 10, before: 'abc' },
      };
      const queryInstance = plainToClass(CursorQueryOptionsArgs, queryObj);
      expect(validateSync(queryInstance)).toEqual([
        {
          children: [],
          constraints: {
            PropertyMax: 'Field paging.last max allowed value is `5`.',
          },
          property: 'paging',
          target: queryObj,
          value: queryObj.paging,
        },
      ]);
    });
  });
});