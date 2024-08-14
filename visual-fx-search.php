<?php
/*
Plugin Name: Visual Effect Search
Description: Allws users to search with words and get reults with visual effects.
Version: 1.0
Author: yuari@konsoft
*/

function visual_fx_search_shortcode($atts)
{
    $atts = array_change_key_case((array)$atts, CASE_LOWER);
    $atts = shortcode_atts(
        array(
            'posts_per_page' => 5,
        ),
        $atts
    );
    $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
    $search_keyword = (isset($_GET['search_keyword'])) ? sanitize_text_field($_GET['search_keyword']) : '';
    $args = array(
        'post_type'      => 'post',
        'posts_per_page' => $atts['posts_per_page'],
        'paged'          => $paged,
        'post_status'    => 'publish',
        'category_name'  => 'visual-text',
        's'              => $search_keyword
    );
    $query = new WP_Query($args);

    ob_start();
?>
    <form id="user-post-form" action="<?php echo home_url() . '/visual-fx-search'; ?>" method="get">
        <div class="search-box">
            <label class="search-label">Word:</label>
            <Input id="search-input" class="search-input" type="text" name="search_keyword" value="<?= $search_keyword ?>">
            <button class="search-btn">Search</button>
        </div>

    </form>
    <div class="fx-container">
        <?php
        if ($query->have_posts() && !empty($search_keyword)) :
            $seeds = [];
            while ($query->have_posts()) {
                $query->the_post();
                $filtered_content = apply_filters('the_content', get_the_content());
                $clean_content = wp_strip_all_tags($filtered_content);
                $seed = calculate_description_value(sanitize_text_field($clean_content));
                array_push($seeds, $seed);
            }
        ?>
            <div id="fx-layer" class="fx-layer" data-seed="<?= implode(' ', $seeds) ?>"></div>
    </div>
    <?php
            // Pagination
    ?>
    <div class="pagination">
        <?php
            echo paginate_links(array(
                'total' => $query->max_num_pages,
                'current' => $paged
            ));
        ?>
    </div>
<?php
        elseif (!empty($search_keyword)) :
            echo '<p class="empty-p">No posts found.</p>';
        endif;

        wp_reset_postdata();
?>
<?php
    return ob_get_clean();
}
add_shortcode('visual_fx_search', 'visual_fx_search_shortcode');

// Enqueue scripts and styles
function enqueue_visual_fx_search_scripts()
{
    //wp_enqueue_script('jquery');
    wp_enqueue_style('visual-fx-search-stylesheet', plugin_dir_url(__FILE__) . 'css/fx.css', false, '1.0', 'all');
    wp_enqueue_script(
        'force-graph', // Handle for the script
        //'https://unpkg.com/3d-force-graph@1.66.6/dist/3d-force-graph.min.js', // URL of the external script
        plugin_dir_url(__FILE__) . 'js/3d-force-graph@1.66.6/dist/3d-force-graph.min.js', // URL of the external script
        array(), // Dependencies (none in this case)
        null, // Version number (optional)
        true // Load script in footer
    );
    wp_enqueue_script('visual-fx-search-script', plugin_dir_url(__FILE__) . 'js/fx1.js', array(/* 'jquery',  */'force-graph'), null, true);
    /* wp_localize_script('visual-fx-search-script', 'custom_ajax_object', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('custom-ajax-nonce')
    )); */
}
add_action('wp_enqueue_scripts', 'enqueue_visual_fx_search_scripts');

function add_module_type_to_script($tag, $handle, $src)
{
    // Check if the handle matches your script handle
    if ('visual-fx-search-script' === $handle) {
        // Add the type="module" attribute to the script tag
        $tag = '<script src="' . esc_url($src) . '" type="module"></script>';
    }
    return $tag;
}
add_filter('script_loader_tag', 'add_module_type_to_script', 10, 3);

// handle post
function handle_search_ajax()
{
    // Verify nonce for security
    if (!check_ajax_referer('custom-ajax-nonce', 'nonce'))
        wp_die();

    $value = calculate_description_value(sanitize_text_field($_POST['search_text']));
    echo $value;
    wp_die();
}
add_action('wp_ajax_handle_search_ajax', 'handle_search_ajax');
add_action('wp_ajax_nopriv_handle_search_ajax', 'handle_search_ajax');

// Custom function to calculate total characters and characters convert into numbers
function calculate_description_value($description)
{
    $letter_values = [
        'a' => 0.01, 'b' => 0.1151, 'c' => 0.2201, 'd' => 0.3252, 'e' => 0.4302, 'f' => 0.5353, 'g' => 0.6403, 'h' => 0.7454, 'i' => 0.8504, 'j' => 0.9555, 'k' => 3.93, 'l' => 4.88, 'm' => 9.61, 'n' => 9.38, 'o' => 6.49, 'p' => 3.25, 'q' => 9.65, 'r' => 4.52, 's' => 1.54, 't' => 8.82, 'u' => 9.95, 'v' => 7.25, 'w' => 9.64, 'x' => 7.1, 'y' => 6.81, 'z' => 6.65, 'A' => 4.12, 'B' => 0.38, 'C' => 4.87, 'D' => 6.69, 'E' => 2.19, 'F' => 3.07, 'G' => 5.58, 'H' => 3.23, 'I' => 0.86, 'J' => 5.25, 'K' => 1.84, 'L' => 2.68, 'M' => 6.89, 'N' => 8.73, 'O' => 6.99, 'P' => 3.59, 'Q' => 8.7, 'R' => 9.75, 'S' => 5.46, 'T' => 7.64, 'U' => 6.6, 'V' => 3.42, 'W' => 4.0, 'X' => 5.34, 'Y' => 6.66, 'Z' => 8.49, '0' => 1.43, '1' => 3.07, '2' => 3.64, '3' => 7.49, '4' => 4.22, '5' => 4.7, '6' => 3.26, '7' => 4.37, '8' => 6.65, '9' => 0.21, '!' => 8.67, '"' => 9.16, '#' => 0.56, '$' => 6.51, '%' => 9.9, '&' => 4.7, "'" => 8.21, '(' => 2.89, ')' => 2.19, '*' => 9.79, '+' => 9.08, ',' => 6.0, '-' => 8.16, '.' => 9.48, '/' => 2.88, ':' => 7.74, ';' => 2.28, '<' => 9.27, '=' => 4.46, '>' => 4.27, '?' => 9.53, '@' => 2.67, '[' => 1.91, '\\' => 9.62, ']' => 7.99, '^' => 2.06, '_' => 4.95, '`' => 9.03, '{' => 2.61, '|' => 8.2, '}' => 8.37, '~' => 6.4, ' ' => 3.32
        // Add more letters and their values as needed
    ];

    $total_value = 0;
    $total_letters = 0;

    // Calculate total value and total letters
    for ($i = 0; $i < strlen($description); $i++) {
        $letter = $description[$i];
        if (isset($letter_values[$letter])) {
            $total_value += $letter_values[$letter];
        }
        $total_letters++;
    }

    // Prevent division by zero
    if ($total_letters == 0) {
        return 0;
    }

    // Calculate the total value
    //return $total_value / $total_letters;
    return $total_value;
}

/*
function display_image_posts_with_pagination($atts)
{
    ob_start();
    // Shortcode attributes
    $atts = shortcode_atts(array(
        'posts_per_page' => 10
    ), $atts, 'image_posts');

    // Query for posts
    $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
    $args = array(
        'post_type'      => 'post', // Change to your custom post type if needed
        'posts_per_page' => $atts['posts_per_page'],
        'paged'          => $paged,
        'post_status'    => 'publish'
    );

    $query = new WP_Query($args);

    if ($query->have_posts()) {
        echo '<div class="user-posts">';
        while ($query->have_posts()) {
            $query->the_post();
    ?>
            <div class="post-item">
                <h4><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
                <div class="post-thumbnail">
                    <?php if (has_post_thumbnail()) {
                    echo '<a href="' . get_the_post_thumbnail_url() . '" download>';
                        the_post_thumbnail();
                    echo '</a>';
                    } ?>
                </div>
                <div class="post-excerpt">
                    <?php the_excerpt(); ?>
                </div>
                <div class="post-images">
                    <?php
                    $attachments = array_keys(get_attached_media('image', get_the_ID()));
                    echo wp_get_attachment_image($attachments[0], 'thumbnail');
                    echo '<span>+</span>';
                    echo wp_get_attachment_image($attachments[1], 'thumbnail');
                    echo '<span>=</span>';
                    echo wp_get_attachment_image($attachments[2], 'thumbnail');
                    ?>
                </div>
            </div>
<?php
        }
        echo '</div>';

        // Pagination
        echo '<div class="pagination-container">';
        $big = 999999999; // need an unlikely integer
        echo paginate_links(array(
            'base'      => str_replace($big, '%#%', esc_url(get_pagenum_link($big))),
            'format'    => '?paged=%#%',
            'current'   => max(1, get_query_var('paged')),
            'total'     => $query->max_num_pages
        ));
        echo '</div>';

        wp_reset_postdata();
    } else {
        echo '<div>No posts found.</div>';
    }
    return ob_get_clean();
}
add_shortcode('image_posts', 'display_image_posts_with_pagination');

// Enqueue scripts and styles
function enqueue_gallery_scripts()
{
    wp_enqueue_style('image-gallery-stylesheet', plugin_dir_url(__FILE__) . 'css/gallery.css', false, '1.0', 'all');
    wp_enqueue_script('image-gallery-script', plugin_dir_url(__FILE__) . 'js/gallery.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'enqueue_gallery_scripts');
 */