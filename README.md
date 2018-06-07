# redux-render-prop

Redux with [render prop components][1]. Typescript friendly.

Usage

```ts
import {bindActionCreators} from "redux";
import {makeCreator} from "redux-render-prop";

// Define state as a single type
interface State {
    counters: {
        [name: string]: {count: number};
    };
}

// Define some actions creators. Works well with Redutser.
const ActionCreators = {
    incrementByName: (name: string) => {
        return {type: "INC", name};
    },
};

// Create render prop component creator with app specific types
const createAppComponent = makeCreator({
    // creators infer the state type from here
    prepareState: (state: State) => state,

    // Same goes for the actions
    prepareActions: dispatch => bindActionCreators(ActionCreators, dispatch),
});

// Create render prop component for counters.
// Own props type is used to infer types for the component props
const CounterConnect = createAppComponent({
    mapState: (state, ownProps: {name: string}) => ({
        count: state.counters[ownProps.name].count,
    }),
    mapActions: (actions, ownProps) => ({
        inc() {
            actions.incrementByName(ownProps.name);
        },
    }),
});

const App = () => (
    <div>
        <CounterConnect
            name="foo" // required by the ownProps type
            render={(data, actions) => (
                // Fully typed data and actions
                <button onClick={actions.inc}>{data.count}</button>
            )}
        />
    </div>
);
```

[1]: https://reactjs.org/docs/render-props.html
