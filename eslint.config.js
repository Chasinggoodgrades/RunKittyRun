// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: ['src/war3map.d.ts'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'no-restricted-syntax': [
                'error',

                // static methods (incl. abstract)
                {
                    selector:
                        ':matches(MethodDefinition[static=true], TSAbstractMethodDefinition[static=true]) ' +
                        ':matches(MemberExpression[object.type="ThisExpression"], ThisExpression)',
                    message: 'Do not use `this` in static class members. Use the class name instead.',
                },

                // static fields / class properties
                {
                    selector:
                        ':matches(PropertyDefinition[static=true], ClassProperty[static=true]) ' +
                        ':matches(MemberExpression[object.type="ThisExpression"], ThisExpression)',
                    message: 'Do not use `this` in static class members. Use the class name instead.',
                },

                // static initialization blocks
                {
                    selector: 'StaticBlock :matches(MemberExpression[object.type="ThisExpression"], ThisExpression)',
                    message: 'Do not use `this` in static class members. Use the class name instead.',
                },
            ],
            '@typescript-eslint/no-explicit-any': ['off'],
            '@typescript-eslint/no-require-imports': ['off'],
            'no-extra-boolean-cast': ['off'],
            '@typescript-eslint/no-unused-expressions': ['off'],
            '@typescript-eslint/no-unused-vars': ['off'],
            'no-empty': ['off'],
        },
    }
)
