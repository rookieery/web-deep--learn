var Generator = require('yeoman-generator/lib');

module.exports = class extends Generator {
    // The name `constructor` is important here
    constructor(args, opts) {
        // Calling the super constructor is important so our generator is correctly set up
        super(args, opts);
    }

    async initPackage() {
        let answer = await this.prompt({
            type: 'input',
            name: 'name',
            message: 'Your project name',
            default: this.appname
        });
        const pkgJson = {
            "name": answer.name,
            "version": "1.0.0",
            "description": "",
            "main": "generators/app/index.js",
            "scripts": {
                "build": "webpack",
                "test": "mocha --require @babel/register",
                "coverage": "nyc mocha"
            },
            "author": "",
            "license": "ISC",
            "dependencies": {

            }
        };
        // Extend or create package.json file in destination path
        this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
        this.npmInstall(["vue"], { 'saveDev': false });
        this.npmInstall(["webpack", "webpack-cli", "vue-loader@^15.2.1", "vue-template-compiler",
            "mocha", "nyc", "babel-loader",
            "vue-style-loader", "css-loader", "copy-webpack-plugin", "babel-plugin-istanbul",
            "@babel/core", "@babel/preset-env", "@babel/register", "@istanbuljs/nyc-config-babel",], { 'saveDev': true });
        this.fs.copyTpl(
            this.templatePath('sample-test.js'),
            this.destinationPath('test/sample-test.js'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('.babelrc'),
            this.destinationPath('.babelrc'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('.nycrc'),
            this.destinationPath('.nycrc'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('HelloWorld.vue'),
            this.destinationPath('src/HelloWorld.vue'),
            {}
        );
        this.fs.copyTpl(
            this.templatePath('webpack.config.js'),
            this.destinationPath('webpack.config.js')
        );
        this.fs.copyTpl(
            this.templatePath('main.js'),
            this.destinationPath('src/main.js')
        );
        this.fs.copyTpl(
            this.templatePath('index.html'),
            this.destinationPath('src/index.html'),
            { title: answer.name }
        )
    }
};