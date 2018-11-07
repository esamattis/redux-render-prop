import React from "react";
import {
    makeComponentCreator,
    MappedState,
    MappedActions,
} from "../src/redux-render-prop";

// for asserting types
let num: number = 1;
let str: string = "";

const initialState = {foo: 2};

const createComponent = makeComponentCreator({
    prepareState: state => state as typeof initialState,
    prepareActions: dispatch => ({}),
});

const FooConnect = createComponent({
    mapState: (state, props: {id: string}) => {
        num = state.foo;

        // $ExpectError
        str = state.foo;

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

declare const mappedState: MappedState<typeof FooConnect>;
const mappedStateAssign: {bar: string} = mappedState;
// $ExpectError
num = mappedState;

declare const mappedActions: MappedActions<typeof FooConnect>;
const mappedActionsAssign: {hello(): "hello"} = mappedActions;
// $ExpectError
num = mappedActions;

const TestBasic = () => (
    <div>
        <FooConnect
            id="1"
            render={data => {
                str = data.bar;

                // $ExpectError
                num = data.bar;

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

class MyComponent {
    renderFoo(data: MappedState<typeof FooConnect>) {
        return <span>{data.bar}</span>;
    }

    render() {
        return <FooConnect id="1" render={this.renderFoo.bind(this)} />;
    }
}
