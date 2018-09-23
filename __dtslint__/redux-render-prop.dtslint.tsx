import React from "react";
import {
    makeComponentCreator,
    MappedState,
    MappedActions,
} from "../src/redux-render-prop";

const initialState = {foo: 2};

const createComponent = makeComponentCreator({
    prepareState: state => state as typeof initialState,
    prepareActions: dispatch => ({}),
});

const FooConnect = createComponent({
    mapState: (state, props: {id: string}) => {
        state.foo; // $ExpectType number

        return {
            bar: String(state.foo),
        };
    },
    mapActions: () => ({
        hello() {
            return "hello";
        },
    }),
});

// $ExpectType { bar: string; }
type MappedStateType = MappedState<typeof FooConnect>;

// $ExpectType { hello(): "hello"; }
type MappedActionsType = MappedActions<typeof FooConnect>;

const TestBasic = () => (
    <div>
        <FooConnect
            id="1"
            render={data => {
                data.bar; // $ExpectType string

                return <span>{data.bar}</span>;
            }}
        />
    </div>
);

const TestPropTypeError = () => (
    <div>
        <FooConnect // $ExpectError
            render={data => {
                return <span>{data.bar}</span>;
            }}
        />
    </div>
);

const TestPropTypeError2 = () => (
    <div>
        <FooConnect
            id={/bad/} // $ExpectError
            render={data => {
                return <span>{data.bar}</span>;
            }}
        />
    </div>
);
