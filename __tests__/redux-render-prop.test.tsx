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
            const {count} = this.state;

            return (
                <div>
                    <button data-testid="button" onClick={this.increment}>
                        inc
                    </button>
                    <div data-testid="parent-count-outer">{count}</div>
                    <FooConnect
                        render={data => (
                            <div>
                                <div data-testid="foo">{data.mappedFoo}</div>
                                <div data-testid="parent-count-inner">
                                    {count}
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

test("state can be updated", () => {
    const initialState = {foo: "initialfoo", bar: "initialbar"};
    const fooAction = {type: "NEW_FOO", foo: "newfoo"};

    function reducer(
        state: typeof initialState,
        action: typeof fooAction,
    ): typeof initialState {
        if (action.type === "NEW_FOO") {
            return {...state, foo: action.foo};
        }

        return state;
    }

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            newFoo() {
                dispatch(fooAction);
            },
        }),
    });

    const FooConnect = createComponent({
        mapState: state => ({mappedFoo: state.foo}),
        mapActions: actions => actions,
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={(data, actions) => (
                        <button data-testid="button" onClick={actions.newFoo}>
                            {data.mappedFoo}
                        </button>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const button = rtl.getByTestId("button");

    expect(button.innerHTML).toBe("initialfoo");

    Simulate.click(button);

    expect(button.innerHTML).toBe("newfoo");

    store.dispatch({type: "NEW_FOO", foo: "secondfoo"});

    expect(button.innerHTML).toBe("secondfoo");
});

test("unrelated state updates don't cause render", () => {
    const initialState = {foo: "initialfoo", bar: "initialbar"};
    const fooAction = {type: "NEW_FOO", foo: "newfoo"};
    const renderSpy = jest.fn();
    const fooReducerSpy = jest.fn();

    function reducer(
        state: typeof initialState,
        action: typeof fooAction,
    ): typeof initialState {
        if (action.type === "NEW_FOO") {
            fooReducerSpy();
            return {...state, foo: action.foo};
        }

        return state;
    }

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const BarConnect = createComponent({
        mapState: state => ({mappedBar: state.bar}),
        mapActions: actions => actions,
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <BarConnect
                    render={(data, actions) => (
                        <div data-testid="button">
                            {(renderSpy(), data.mappedBar)}
                        </div>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const button = rtl.getByTestId("button");

    expect(button.innerHTML).toBe("initialbar");

    store.dispatch(fooAction);

    expect(fooReducerSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
});

test("can use ownprops in map state", () => {
    const initialState = {foo: "initialfoo"};

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createComponent({
        mapState: (state, props: {extra: string}) => ({
            mappedFoo: state.foo + props.extra,
        }),
        mapActions: actions => actions,
    });

    const store = createStore(s => s, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    extra="EXTRA"
                    render={(data, actions) => (
                        <div data-testid="foo">{data.mappedFoo}</div>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const foo = rtl.getByTestId("foo");

    expect(foo.innerHTML).toBe("initialfooEXTRA");
});

test("can use ownprops in map actions", () => {
    const initialState = {foo: "initialfoo"};
    const fooAction = {type: "NEW_FOO", foo: "newfoo"};

    function reducer(
        state: typeof initialState,
        action: typeof fooAction,
    ): typeof initialState {
        if (action.type === "NEW_FOO") {
            return {...state, foo: action.foo};
        }

        return state;
    }

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            dispatch,
        }),
    });

    const FooConnect = createComponent({
        mapState: (state, ownProps: {propArg: string}) => ({
            mappedFoo: state.foo,
        }),
        mapActions: (actions, ownProps) => ({
            newFoo(actionArg: string) {
                actions.dispatch({
                    type: "NEW_FOO",
                    foo: `BASE|${actionArg}|${ownProps.propArg}`,
                });
            },
        }),
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    propArg="PROP_ARG"
                    render={(data, actions) => (
                        <button
                            data-testid="button"
                            onClick={() => {
                                actions.newFoo("ACTION_ARG");
                            }}
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

    expect(button.innerHTML).toBe("BASE|ACTION_ARG|PROP_ARG");
});

test("ownprops won't cause useless state or action mapping", () => {
    const mapStateSpy = jest.fn();
    const mapActionsSpy = jest.fn();

    const initialState = {foo: "initialfoo"};

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            dispatch,
        }),
    });

    const FooConnect = createComponent({
        mapState: (state, ownProps: {propArg: string}) => {
            mapStateSpy();
            return {
                mappedFoo: state.foo + ownProps.propArg,
            };
        },
        mapActions: (actions, ownProps) => {
            mapActionsSpy();
            return {
                newFoo(actionArg: string) {},
            };
        },
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
                        propArg="ding"
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

    const button = rtl.getByTestId("button");
    Simulate.click(button);

    expect(mapActionsSpy).toHaveBeenCalledTimes(1);
    expect(mapStateSpy).toHaveBeenCalledTimes(1);
});

test("state change won't cause action mapping", () => {
    const mapActionsSpy = jest.fn();

    const initialState = {foo: "initialfoo", bar: "initialbar"};
    const fooAction = {type: "NEW_FOO", foo: "newfoo"};

    function reducer(
        state: typeof initialState,
        action: typeof fooAction,
    ): typeof initialState {
        if (action.type === "NEW_FOO") {
            return {...state, foo: action.foo};
        }

        return state;
    }

    const createComponent = makeCreator({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            newFoo() {
                dispatch(fooAction);
            },
        }),
    });

    const FooConnect = createComponent({
        mapState: state => ({mappedFoo: state.foo}),
        mapActions: actions => {
            mapActionsSpy();
            return actions;
        },
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={(data, actions) => (
                        <button data-testid="button" onClick={actions.newFoo}>
                            {data.mappedFoo}
                        </button>
                    )}
                />
            </div>
        </Provider>
    );

    render(<App />);

    store.dispatch({type: "NEW_FOO", foo: "ding"});

    expect(mapActionsSpy).toHaveBeenCalledTimes(1);
});
