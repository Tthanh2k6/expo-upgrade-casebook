// React 19 elements carry $$typeof Symbol.for('react.transitional.element'), which the
// pretty-format shipped with Jest 29 does not recognise: it then walks the element's
// _owner fiber and fails with "RangeError: Invalid string length". Print them as before.
const TRANSITIONAL = Symbol.for('react.transitional.element');
const LEGACY = Symbol.for('react.element');

module.exports = {
  test: (val) => val != null && val.$$typeof === TRANSITIONAL,
  serialize: (val, config, indentation, depth, refs, printer) =>
    printer(
      { $$typeof: LEGACY, type: val.type, key: val.key, ref: val.ref ?? null, props: val.props },
      config,
      indentation,
      depth,
      refs,
    ),
};
