import {connect} from "react-redux";

// Yep. We do a lot with any here.
const anyConnect = connect as any;

export function makeCreator<State, Actions>(makeOptions: {
    prepareState: (state: any) => State;
    prepareActions: (dispatch: Function) => Actions;
}) {
    return function createComponent<
        MappedState,
        MappedActions,
        OwnProps
    >(options: {
        mapState?: (state: State, ownProps: OwnProps) => MappedState;
        mapActions?: (actions: Actions, ownProps: OwnProps) => MappedActions;
    }) {
        const RenderPropComponent = anyConnect(
            (state: any, ownProps: OwnProps) => {
                if (options.mapState) {
                    return options.mapState(
                        makeOptions.prepareState(state),
                        ownProps,
                    );
                }
                return {};
            },
            (dispatch: any, props: OwnProps) => {
                if (options.mapActions) {
                    return options.mapActions(
                        makeOptions.prepareActions(dispatch),
                        props,
                    );
                } else {
                    return {};
                }
            },
        )((mappedProps: any) => mappedProps.render(mappedProps));

        // But return the component with proper types
        return RenderPropComponent as React.StatelessComponent<
            OwnProps & {
                render: (props: MappedState & MappedActions) => React.ReactNode;
            }
        >;
    };
}
