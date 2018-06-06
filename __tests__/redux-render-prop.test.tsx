import React from "react";
import {render, Simulate, wait} from "react-testing-library";

const Foo = () => (
    <div>
        <button
            data-testid="foo"
            onClick={() => {
                console.log("foo");
            }}
        />
    </div>
);

test("foo ts", () => {
    const foo = render(<Foo />);

    const el = foo.getByTestId("foo");
    Simulate.click(el);

    expect(el).toBeTruthy();
});
