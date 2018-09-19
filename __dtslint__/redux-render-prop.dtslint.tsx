import React from "react";
import {makeComponentCreator} from "../src/redux-render-prop";

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
});

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
