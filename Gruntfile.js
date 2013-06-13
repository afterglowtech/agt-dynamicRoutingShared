module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-docular');

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['jshint', 'clean', 'concat']);
  grunt.registerTask('release', ['build','uglify', 'docular']);

  grunt.registerTask('timestamp', function() {
    grunt.log.subhead(Date());
  });

  // Project configuration.
  grunt.initConfig({
    dirs: {
      dist: 'dist',
      components: 'components',
      lib: 'lib',
      src: {
        js: ['src/**/*.js']
      }
    },
    pkg: grunt.file.readJSON('package.json'),
    docular: {
      groups: [
        {
          groupTitle: 'agt-dynamicRoutingShared',
          groupId: 'dynamicRoutingShared',
          groupIcon: 'icon-book',
          showSource: true,
          sections: [
            {
              id: 'api',
              title: 'API',
              docs: [
                './docs/section-api.doc'
              ],
              scripts: [
                './src/common.js'
              ],
              rank: {}
            }
          ]
        }
      ]
//      showDocularDocs: false,
 //     showAngularDocs: false
    },
    banner:
      '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
      ' * Copyright (c) <%= grunt.template.today(\'yyyy\') %> <%= pkg.author.name %>;\n' +
      ' *    Based on https://github.com/angular-ui/ui-router which is \n' +
      ' *    Copyright (c) 2013, Karsten Sperling\n' +
      ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
    header: '',
    footer: '',
    clean: ['<%= dirs.dist %>/*', '<%= dirs.components %>/*', '<%= dirs.lib %>/*'],
    gruntBower: {
      dev: {
        dest: '<%= dirs.dist %>/dependencies'
      }
    },
    bowerTask: {
      install: {
      }
    },
    concat: {
      dist: {
        options: {
          stripBanners: true,
          banner: '<%= banner %>'
        },
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: './src/',      // Src matches are relative to this path.
            src: ['*.js'], // Actual pattern(s) to match.
            dest: '<%= dirs.dist %>/'   // Destination path prefix.
          }
        ]
      }
    },
    uglify: {
      dist: {
        options: {
          banner: '<%= banner %>'
        },
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: '<%= dirs.dist %>/',      // Src matches are relative to this path.
            src: ['*.js'], // Actual pattern(s) to match.
            dest: '<%= dirs.dist %>/',   // Destination path prefix.
            ext: '.min.js'   // Dest filepaths will have this extension.
          }
        ]
      }
    },
    jshint:{
      files:['Gruntfile.js', '<%= dirs.src.js %>'],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });
};
