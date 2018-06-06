import React from "react";
import {render, Simulate} from "react-testing-library";
import {makeCreator} from "../src/redux-render-prop";
import {createStore} from "redux";
import {Provider} from "react-redux";

test("can render data to react", () => {
    const initialState = {foo: "bar"};

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createComponent({
        mapState: state => ({mappedFoo: state.foo}),
    });
    const store = createStore(s => s, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={data => (
                        <div data-testid="foo">{data.mappedFoo}</div>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const el = rtl.getByTestId("foo");

    expect(el.innerHTML).toBe("bar");
});

test("can use actions", () => {
    const initialState = {foo: "bar"};

    const spyAction = jest.fn();

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({spyAction}),
    });

    const FooConnect = createComponent({
        mapState: state => ({mappedFoo: state.foo}),
        mapActions: actions => actions,
    });
    const store = createStore(s => s, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={(data, actions) => (
                        <button
                            data-testid="button"
                            onClick={actions.spyAction}
                        >
                            {data.mappedFoo}
                        </button>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const button = rtl.getByTestId("button");

    Simulate.click(button);

    expect(spyAction).toHaveBeenCalledTimes(1);
});
