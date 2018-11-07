# redux-render-prop

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/redux-render-prop.svg)](https://greenkeeper.io/)

Redux with [render props][1]. Alternative to the `connect()` higher order component.

Very TypeScript friendly. It heavily leverages type inference to
avoid manual typing of props.

Install

```sh
npm install redux-render-prop react-redux@5 # has peer dep of react-redux 5.x
```

For Typescript you will need the types too

```sh
npm install @types/react-dom @types/react @types/react-redux
```

Usage

```ts
import {bindActionCreators} from "redux";
import {makeComponentCreator} from "redux-render-prop";

// Define state as a single type
interface State {
    counters: {
        [name: string]: {count: number};
    };
}

// Define some actions creators
const ActionCreators = {
    incrementByName: (name: string) => {
        return {type: "INC", name};
    },
};

// Create render prop component creator with app specific types.
// There is usually only one of these per app
const createAppComponent = makeComponentCreator({
    // Component creators infer the state type from here.
    //
    // It is possible to return only part of the state here
    // which can be handy if you have a large app and want multiple
    // more specific component creators.
    //
    // You can also return here something other than the state
    // itself. For example you could wrap it with selector helpers.
    prepareState: (state: State) => state,

    // Actions are prepared similarly.
    prepareActions: dispatch => bindActionCreators(ActionCreators, dispatch),
});

// Create render prop component for counters.
const CounterConnect = createAppComponent({
    // State type is infered from the prepareState return value
    mapState: (state, ownProps: {name: string}) => ({
        count: state.counters[ownProps.name].count,
    }),

    // Actions type is infered from the prepareActions and
    // ownProps type is from the mapState ownProps
    mapActions: (actions, ownProps) => ({
        inc() {
            actions.incrementByName(ownProps.name);
        },
    }),
});

// Must be wrapped with <Provider store={store} />
const App = () => (
    <div>
        <CounterConnect
            // required by the ownProps type
            name="foo"
        >
            {(data, actions) => (
                // Fully typed data and actions
                <button onClick={actions.inc}>{data.count}</button>
            )}
        </CounterConnect>
    </div>
);
```

## Memoizing

For high performance situations you may use `memoizeMapState()` to create memoized
selectors on component mount.

```tsx
const FooConnect = createComponent({
    // The initialState is the state at the time of the component
    // mount and it won't change during the component lifetime.
    // Same goes for the initialOwnProps.
    memoizeMapState: (initialState, initialOwnProps) => {
        // using the reselect module
        const selectFoosOnly = createSelector(
            (s: typeof initialState) => s.list,
            list =>
                list.map(obj => ({
                    foo: obj.foo,
                })),
        );

        // Return the actual mapState function
        return (state, ownProps) => {
            return {
                foos: selectFoosOnly(state),
            };
        };
    },
});
```

## Flattening render props

If you find yourself nesting too much you can flatten
the render callbacks type safely with the `MappedState` and `MappedActions`
type helpers like so:

```tsx
import {MappedState, MappedActions} from "redux-render-prop";

class MyComponent {
    renderCounter(
        data: MappedState<typeof CounterConnect>,
        actions: MappedActions<typeof CounterConnect>,
    ) {
        return <button onClick={actions.inc}>{data.count}</button>;
    }

    render() {
        return (
            <CounterConnect name="foo" render={this.renderCounter.bind(this)} />
        );
    }
}
```

There a catch thou: You must use `.bind()` in the render to generate new
function indentity for each render. Otherwise the `renderCounter()` method
won't get called. This is a limitation in the react-redux `connectAdvanced()`
HOC which requires new props to render.

Also the `.bind()` is only completely typesafe with [TypeScript 3.2's `--strictBindCallApply`](https://github.com/Microsoft/TypeScript/pull/27028).

[1]: https://reactjs.org/docs/render-props.html

## Type Safe Action Creators and Reducers?

If you enjoy this checkout
[immer-reducer](https://github.com/epeli/immer-reducer) for type safe Action
Creators and reducers.
