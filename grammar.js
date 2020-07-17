const C = require("tree-sitter-c/grammar")


module.exports = grammar(C, {
  name: 'objc',

  conflicts: ($, original) => original.concat([
    [$._expression, $.protocol_type_specifier],
    [$.keyword_selector],
    [$.struct_specifier],
    [$.union_specifier],
    [$.enum_specifier]
  ]),

  rules: {
    _top_level_item: ($, original) => choice(
      original,
      $.class_interface,
      $.class_implementation,
      $.category_interface,
      $.category_implementation,
      $.protocol_declaration,
      $.protocol_declaration_list,
      $.class_declaration_list
    ),

    _name: $ => field('name', $.identifier),

    _superclass_reference: $ => seq(
      ':', field('superclass', $.identifier)
    ),

    // Declarations

    class_interface: $ => seq(
      '@interface', $._name, optional($._superclass_reference),
      optional($.protocol_reference_list),
      optional($.instance_variables),
      optional($.interface_declaration_list),
      '@end'
    ),

    category_interface: $ => seq(
      '@interface', $._name, '(', field('category', $.identifier),')',
      optional($.protocol_reference_list),
      optional($.interface_declaration_list),
      '@end'
    ),

    protocol_declaration: $ => seq(
      '@protocol', $._name,
      optional($.protocol_reference_list),
      optional($.interface_declaration_list),
      '@end'
    ),

    protocol_declaration_list: $ => seq(
      '@protocol', '<', commaSep1($.identifier), '>', ';'
    ),

    class_declaration_list: $ => seq(
      '@class', commaSep1($.identifier), ';'
    ),

    protocol_reference_list: $ => seq(
      '<', commaSep1($.identifier), '>'
    ),

    instance_variables: $ => seq(
      '{', repeat1($.instance_variable_declaration) ,'}'
    ),

    instance_variable_declaration: $ => choice(
      $._visibility_specification,
      $.field_declaration
    ),

    _visibility_specification: $ => choice(
      $.private,
      $.public,
      $.protected
    ),

    private: $ => '@private',

    public: $ => '@public',

    protected: $ => '@protected',

    interface_declaration_list: $ => repeat1($._interface_declaration),

    _interface_declaration: $ => choice(
      $.declaration,
      $._method_declaration,
    ),

    _method_declaration: $ => choice(
      $.class_method_declaration,
      $.instance_method_declaration
    ),

    class_method_declaration: $ => seq(
      '+',
      field('return_type', optional($._method_type)),
      field('selector', $._method_selector),
      ';'
    ),

    instance_method_declaration: $ => seq(
      '-',
      field('return_type', optional($._method_type)),
      field('selector', $._method_selector),
      ';'
    ),

    // Implementation

    class_implementation: $ => seq(
      '@implementation', $._name, optional($._superclass_reference),
      optional($.instance_variables),
      optional($.implementation_definition_list),
      '@end'
    ),

    category_implementation: $ => seq(
      '@implementation', $._name, '(', field('category', $.identifier),')',
      optional($.implementation_definition_list),
      '@end'
    ),

    implementation_definition_list: $ => repeat1($._implementation_definition),

    _implementation_definition: $ => choice(
      $.function_definition,
      $.declaration,
      $._method_definition
    ),

    _method_definition: $ => choice(
      $.class_method_definition,
      $.instance_method_definition
    ),

    class_method_definition: $ => seq(
      '+',
      field('return_type', optional($._method_type)),
      field('selector', $._method_selector),
      optional($.declaration_list),
      field('body', $.compound_statement)
    ),

    instance_method_definition: $ => seq(
      '-',
      field('return_type', optional($._method_type)),
      field('selector', $._method_selector),
      optional($.declaration_list),
      field('body', $.compound_statement)
    ),

    // Selectors

    _method_selector: $ => choice(
      $.unary_selector,
      seq(
        $.keyword_selector,
        optional(commaSep1($.parameter_declaration)),
        optional(seq(',', '...'))),
    ),

    unary_selector: $ => $.identifier,

    keyword_selector: $ => repeat1($.keyword_declarator),

    keyword_declarator: $ => seq(
      field('keyword', optional($.identifier)),
      ':',
      field('type', optional($._method_type)),
      $._name
    ),

    _method_type: $ => seq(
      '(', $.type_descriptor ,')'
    ),

    // Type specifiers

    _type_identifier: ($, original) => choice(
      original,
      $.protocol_type_specifier
    ),

    protocol_type_specifier: $ => seq(
      $.identifier, $.protocol_reference_list
    ),

    struct_specifier: ($, original) => choice(
      original,
      seq(
        'struct',
        field('name', optional($.identifier)),
        field('body', seq('@defs', '(', field('class_name', $.identifier),')'))
      )
    ),

    type_qualifier: ($, original) => choice(
      original,
      $.protocol_qualifier
    ),

    protocol_qualifier: $ => choice(
      'in',
      'out',
      'inout',
      'bycopy',
      'byref',
      'oneway'
    ),

    // Primary expression

    _expression: ($, original) => choice(
      original,
      $.self,
      $.selector_expression,
      $.message_expression,
      $.protocol_expression,
      $.encode_expression
    ),

    self: $ => 'self',

    message_expression: $ => seq(
      '[', $.receiver, $.message_selector, ']'
    ),

    receiver: $ => choice(
      $._expression,
      $.super
    ),

    super: $ => 'super',

    message_selector: $ => choice(
      $.identifier,
      $.keyword_argument_list
    ),

    keyword_argument_list: $ => repeat1($.keyword_argument),

    keyword_argument: $ => seq(
      optional(field('keyword', $.identifier)),
      ':',
      field('argument', $._expression)
    ),

    selector_expression: $ => seq(
      '@selector', '(', $._selector_name, ')'
    ),

    _selector_name: $ => choice(
      $.identifier,
      repeat1($.keyword_name)
    ),

    keyword_name: $ => choice(
      seq($.identifier, ':'),
      ':'
    ),

    protocol_expression: $ => seq(
      '@protocol', '(', $.identifier, ')'
    ),

    encode_expression: $ => seq(
      '@encode', '(', $.identifier, ')'
    )
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
