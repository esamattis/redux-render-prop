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

test("parent container can cause render prop to render", () => {
    const initialState = {foo: "bar"};

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createComponent({
        mapState: state => ({mappedFoo: state.foo}),
    });

    const store = createStore(s => s, initialState);

    class ParentContainer extends React.Component {
        state = {count: 1};

        increment = () => {
            this.setState({count: this.state.count + 1});
        };

        render() {
            return (
                <div>
                    <button data-testid="button" onClick={this.increment}>
                        inc
                    </button>
                    <div data-testid="parent-count-outer">
                        {this.state.count}
                    </div>
                    <FooConnect
                        render={data => (
                            <div>
                                <div data-testid="foo">{data.mappedFoo}</div>
                                <div data-testid="parent-count-inner">
                                    {this.state.count}
                                </div>
                            </div>
                        )}
                    />
                </div>
            );
        }
    }

    const App = () => (
        <Provider store={store}>
            <div>
                <ParentContainer />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const outer = rtl.getByTestId("parent-count-outer");
    const inner = rtl.getByTestId("parent-count-inner");

    const button = rtl.getByTestId("button");
    Simulate.click(button);

    expect(outer.innerHTML).toBe("2");
    expect(inner.innerHTML).toBe("2");
});
