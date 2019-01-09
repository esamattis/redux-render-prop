import React from "react";
import {render, fireEvent, cleanup} from "react-testing-library";
import {createSelector} from "reselect";
import {makeConnector, RenderNull, MappedState} from "../src/redux-render-prop";
import {createStore} from "redux";
import {Provider} from "react-redux";

afterEach(cleanup);

test("can render data to react", () => {
    const initialState = {foo: "bar"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: state => ({mappedFoo: state.foo}),
    });

    const store = createStore(s => s || initialState, initialState);

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

test("can render data to react children function", () => {
    const initialState = {foo: "bar"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: state => ({mappedFoo: state.foo}),
    });
    const store = createStore(s => s || initialState, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect>
                    {data => <div data-testid="foo">{data.mappedFoo}</div>}
                </FooConnect>
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const el = rtl.getByTestId("foo");

    expect(el.innerHTML).toBe("bar");
});

test("can only use mapActions", () => {
    const initialState = {foo: "bar"};
    const actionSpy = jest.fn();

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapActions: state => ({
            testAction: () => {
                actionSpy();
            },
        }),
    });
    const store = createStore(s => s || initialState, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={(_, actions) => (
                        <button
                            data-testid="button"
                            onClick={actions.testAction}
                        >
                            buttontext
                        </button>
                    )}
                />
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const button = rtl.getByTestId("button");

    fireEvent.click(button);

    expect(button.innerHTML).toBe("buttontext");
    expect(actionSpy).toHaveBeenCalledTimes(1);
});

test("can use actions", () => {
    const initialState = {foo: "bar"};

    const spyAction = jest.fn();

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({spyAction}),
    });

    const FooConnect = createConnect({
        mapState: state => ({mappedFoo: state.foo}),
        mapActions: actions => actions,
    });

    const store = createStore(s => s || initialState, initialState);

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

    fireEvent.click(button);

    expect(spyAction).toHaveBeenCalledTimes(1);
});

test("parent container can cause render prop to render", () => {
    const initialState = {foo: "bar"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: state => ({mappedFoo: state.foo}),
    });

    const store = createStore(s => s || initialState, initialState);

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
    fireEvent.click(button);

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

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            newFoo() {
                dispatch(fooAction);
            },
        }),
    });

    const FooConnect = createConnect({
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

    fireEvent.click(button);

    expect(button.innerHTML).toBe("newfoo");

    store.dispatch({type: "NEW_FOO", foo: "secondfoo"});

    expect(button.innerHTML).toBe("secondfoo");
});

test("unrelated state updates don't cause render", () => {
    const initialState = {foo: "initialfoo", bar: "initialbar"};
    const fooAction = {type: "NEW_FOO", foo: "first"};
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

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const BarConnect = createConnect({
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

    // first dispatch: Just make sure the reducer is called
    expect(fooReducerSpy).toHaveBeenCalledTimes(1);

    // first: should rendered once
    expect(renderSpy).toHaveBeenCalledTimes(1);

    store.dispatch({type: "NEW_FOO", foo: "second"});

    // second dispatch: Just make sure the reducer is called
    expect(fooReducerSpy).toHaveBeenCalledTimes(2);

    // second: should have rendered again because the derived state did not change
    expect(renderSpy).toHaveBeenCalledTimes(1);
});

test("can use ownprops in map state", () => {
    const initialState = {foo: "initialfoo"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: (state, props: {extra: string}) => ({
            mappedFoo: state.foo + props.extra,
        }),
        mapActions: actions => actions,
    });

    const store = createStore(s => s || initialState, initialState);

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

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            dispatch,
        }),
    });

    const FooConnect = createConnect({
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

    fireEvent.click(button);

    expect(button.innerHTML).toBe("BASE|ACTION_ARG|PROP_ARG");
});

test("static own props won't cause useless state or action mapping", () => {
    const mapStateSpy = jest.fn();
    const mapActionsSpy = jest.fn();
    const prepareActionsSpy = jest.fn();
    const renderSpy = jest.fn();

    const initialState = {foo: "initialfoo"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => {
            prepareActionsSpy();
            return {
                dispatch,
            };
        },
    });

    const FooConnect = createConnect({
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

    const store = createStore(s => s || initialState, initialState);

    class ParentContainer extends React.Component {
        state = {count: 1};

        increment = () => {
            this.setState({count: this.state.count + 1});
        };

        render() {
            renderSpy();
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
    fireEvent.click(button);

    // has been rendered twice
    expect(renderSpy).toHaveBeenCalledTimes(2);

    // but mapped and prepared only once
    expect(mapActionsSpy).toHaveBeenCalledTimes(1);
    expect(mapStateSpy).toHaveBeenCalledTimes(1);
    expect(prepareActionsSpy).toHaveBeenCalledTimes(1);
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

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({
            newFoo() {
                dispatch(fooAction);
            },
        }),
    });

    const FooConnect = createConnect({
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

test("prepare actions is called only once per mount", () => {
    const mapStateSpy = jest.fn();
    const mapActionsSpy = jest.fn();
    const prepareActionsSpy = jest.fn();

    const initialState = {foo: "initialfoo"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => {
            prepareActionsSpy();
            return {
                dispatch,
            };
        },
    });

    const FooConnect = createConnect({
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

    const store = createStore(s => s || initialState, initialState);

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
                    <FooConnect propArg={String(this.state.count)}>
                        {data => (
                            <div>
                                <div data-testid="foo">{data.mappedFoo}</div>
                                <div data-testid="parent-count-inner">
                                    {this.state.count}
                                </div>
                            </div>
                        )}
                    </FooConnect>
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
    fireEvent.click(button);

    expect(mapActionsSpy).toHaveBeenCalledTimes(2);
    expect(mapStateSpy).toHaveBeenCalledTimes(2);
    expect(prepareActionsSpy).toHaveBeenCalledTimes(1);
});

test("renders null when RenderNull is thrown from mapState", () => {
    const initialState = {foo: "bar"};

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: state => {
            if (state.foo === "bar") {
                throw new RenderNull();
            }

            return {mappedFoo: state.foo};
        },
    });

    const store = createStore(s => s || initialState, initialState);

    const App = () => (
        <Provider store={store}>
            <div data-testid="container">
                start
                <FooConnect
                    render={data => (
                        <span>
                            in render
                            {data.mappedFoo}
                        </span>
                    )}
                />
                end
            </div>
        </Provider>
    );

    const rtl = render(<App />);

    const el = rtl.getByTestId("container");

    expect(el.innerHTML).toBe("startend");
});

test("memoizeMapState can optimize rendering", () => {
    const renderSpy = jest.fn();

    const initialState = {
        other: "init",
        list: [{bar: "first"}, {bar: "second"}],
    };

    const fooAction = {type: "SET_OTHER", other: "othernew"};

    function reducer(
        state: typeof initialState,
        action: typeof fooAction,
    ): typeof initialState {
        if (action.type === "SET_OTHER") {
            return {...state, other: action.other};
        }

        return state;
    }

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        memoizeMapState: state => {
            const sel = createSelector(
                (s: typeof state) => s.list,
                list =>
                    list.map(foo => ({
                        upper: foo.bar.toLocaleUpperCase(),
                    })),
            );

            return state => {
                return {
                    mappedFoo: sel(state),
                };
            };
        },
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    render={data => (
                        <div>
                            {(renderSpy(), null)}
                            {data.mappedFoo.map((foo, i) => (
                                <div key={i}>{foo.upper}</div>
                            ))}
                        </div>
                    )}
                />
            </div>
        </Provider>
    );

    render(<App />);

    store.dispatch(fooAction);

    expect(renderSpy).toBeCalledTimes(1);
});

test("own props are cached by shallow equality", () => {
    const mapSpy = jest.fn();
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

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    let prevProps: any = null;
    const FooConnect = createConnect({
        mapState: (state, props: {ding: number}) => {
            mapSpy();

            if (prevProps) {
                expect(prevProps).toBe(props);
            }

            if (!prevProps) {
                prevProps = props;
            }

            return {mappedFoo: state.foo};
        },
        mapActions: actions => actions,
    });

    const store = createStore(reducer as any, initialState);

    const App = () => (
        <Provider store={store}>
            <div>
                <FooConnect
                    ding={1}
                    render={(data, actions) => <div>{data.mappedFoo}</div>}
                />
            </div>
        </Provider>
    );

    render(<App />);

    store.dispatch({type: "NEW_FOO", foo: "secondfoo"});

    expect(mapSpy).toHaveBeenCalledTimes(2);
});

test("can render without render prop change", () => {
    const initialState = {foo: "bar"};
    const renderConnectSpy = jest.fn();

    const createConnect = makeConnector({
        prepareState: state => state as typeof initialState,
        prepareActions: dispatch => ({}),
    });

    const FooConnect = createConnect({
        mapState: state => ({mappedFoo: state.foo}),
    });

    const store = createStore(s => s || initialState, initialState);

    class ParentContainer extends React.Component {
        state = {count: 1};

        increment = () => {
            this.setState({count: this.state.count + 1});
        };

        renderConnect = (data: MappedState<typeof FooConnect>) => {
            renderConnectSpy();
            return (
                <div>
                    <div data-testid="data">{data.mappedFoo}</div>
                    <div data-testid="state">{this.state.count}</div>
                </div>
            );
        };

        render() {
            const {count} = this.state;

            return (
                <div>
                    <button data-testid="button" onClick={this.increment}>
                        inc
                    </button>
                    <div data-testid="parent-count-outer">{count}</div>
                    <FooConnect render={this.renderConnect} />
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
    fireEvent.click(button);

    expect(renderConnectSpy).toHaveBeenCalledTimes(2);

    const data = rtl.getByTestId("data");
    const stateCount = rtl.getByTestId("state");

    expect(data.innerHTML).toBe("bar");
    expect(stateCount.innerHTML).toBe("2");
});
