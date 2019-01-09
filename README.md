# redux-render-prop

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/redux-render-prop.svg)](https://greenkeeper.io/)

Redux with [render props][1]. Alternative to the `connect()` higher order component.

Read an introductory [blog post here](https://medium.com/@esamatti/type-safe-boilerplate-free-redux-906844ec6325).

[1]: https://reactjs.org/docs/render-props.html

Very TypeScript friendly. It heavily leverages type inference to
avoid manual typing of props.

## Install

For react-redux 6.x

```sh
npm install redux-render-prop react-redux@6 # has peer dep of react-redux 6.x
```

For react-redux 5.x you must use pre 0.7 versions

```sh
npm install redux-render-prop@0.6 react-redux@5 # has peer dep of react-redux 5.x
```

For Typescript you will need the types too

```sh
npm install @types/react-dom @types/react @types/react-redux
```

## Usage

```ts
import {makeConnector} from "redux-render-prop";
import {bindActionCreators} from "redux";

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
const createAppConnect = makeConnector({
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
const CounterConnect = createAppConnect({
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
        return <CounterConnect name="foo">{this.renderCounter}</CounterConnect>;
    }
}
```

You can also use it to pass the props to class components if you need to access
the mapped state or actions from lifecycle methods.

```tsx
class ClassComponent extends React.Component<
    MappedState<typeof CounterConnect>
> {
    componentDidMount() {
        // do something with this.props.count
    }

    render() {
        return <div>{this.props.count}</div>;
    }
}

export default () => (
    <CounterConnect name="wrapped">
        {data => <ClassComponent {...data} />}
    </CounterConnect>
);
```

## Memoizing

For advanced high performance you may use `memoizeMapState()` to
create memoized selectors on component mount.

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

## Examples

Here's a more complete example with [Immer Reducer](https://github.com/epeli/immer-reducer):

<https://github.com/epeli/typescript-redux-todoapp>
