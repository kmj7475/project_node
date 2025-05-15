<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div>{{ board.title }}</div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      board: {},
    };
  },
  created() {
    fetch("/api/board")
      .then((res) => res.json())
      .then((res) => (this.board = res));
  },
};
</script>
